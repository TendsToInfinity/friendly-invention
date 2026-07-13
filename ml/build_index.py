#!/usr/bin/env python3
"""
Mentora AI — curriculum knowledge-index builder (RAG ingestion).

Reads the Markdown files in content/curriculum/, splits each into passages,
and writes data/knowledge-index.json. When an OpenAI API key is available it
also computes an embedding vector for every passage so the app can do
semantic retrieval; without a key it still emits a valid keyword-only index
so the pipeline runs anywhere (offline, CI, this sandbox).

This is the ONLY "training-like" step, and it is not model training — it is
grounding an existing model in YOUR curriculum. Run it whenever the content
changes:

    cd ml
    pip install -r requirements.txt
    export OPENAI_API_KEY=sk-...        # optional, enables semantic search
    python build_index.py

The generated data/knowledge-index.json is consumed at request time by
server/retrieval.ts.
"""

from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

EMBEDDING_MODEL = "text-embedding-3-small"
MAX_CHARS = 700          # target passage size
MIN_CHARS = 120          # merge passages shorter than this
STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "is", "are", "it", "its",
    "for", "on", "with", "as", "by", "that", "this", "these", "those", "be",
    "into", "from", "at", "you", "your", "can", "not", "if", "each", "so",
    "which", "when", "then", "than", "they", "them", "we", "our",
}

ROOT = Path(__file__).resolve().parent.parent
CONTENT_DIR = ROOT / "content" / "curriculum"
OUTPUT_PATH = ROOT / "data" / "knowledge-index.json"


def parse_frontmatter(text: str) -> tuple[dict[str, str], str]:
    """Split simple `key: value` YAML-ish frontmatter from the body."""
    meta: dict[str, str] = {}
    if text.startswith("---"):
        _, fm, body = text.split("---", 2)
        for line in fm.strip().splitlines():
            if ":" in line:
                key, value = line.split(":", 1)
                meta[key.strip()] = value.strip().strip('"')
        return meta, body.strip()
    return meta, text.strip()


def chunk_passages(body: str) -> list[str]:
    """Split on headings and blank lines, then merge tiny fragments."""
    raw = re.split(r"\n\s*\n", body)
    passages: list[str] = []
    buffer = ""
    for block in raw:
        block = block.strip()
        if not block:
            continue
        candidate = f"{buffer}\n{block}".strip() if buffer else block
        if len(candidate) < MIN_CHARS:
            buffer = candidate
            continue
        if len(candidate) > MAX_CHARS and buffer:
            passages.append(buffer)
            buffer = block
        else:
            buffer = candidate
        if len(buffer) >= MAX_CHARS:
            passages.append(buffer)
            buffer = ""
    if buffer:
        passages.append(buffer)
    return passages


def keywords(text: str) -> list[str]:
    """Distinct content tokens used for offline keyword retrieval."""
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9-]+", text.lower())
    seen: list[str] = []
    for token in tokens:
        if len(token) > 2 and token not in STOPWORDS and token not in seen:
            seen.append(token)
    return seen


def load_openai_client():
    """Return an OpenAI client if a key is set and the SDK is installed, else None."""
    if not os.environ.get("OPENAI_API_KEY"):
        print("No OPENAI_API_KEY set — building a keyword-only index "
              "(semantic search will activate once a key is provided).")
        return None
    try:
        from openai import OpenAI
    except ImportError:
        print("openai package not installed — keyword-only index. "
              "Run: pip install -r requirements.txt")
        return None
    return OpenAI()


def embed_all(client, texts: list[str]) -> list[list[float]]:
    """Embed passages in batches; on any API error, fall back to no embeddings."""
    vectors: list[list[float]] = []
    batch_size = 64
    try:
        for start in range(0, len(texts), batch_size):
            batch = texts[start:start + batch_size]
            response = client.embeddings.create(model=EMBEDDING_MODEL, input=batch)
            vectors.extend(item.embedding for item in response.data)
            print(f"  embedded {min(start + batch_size, len(texts))}/{len(texts)} passages")
        return vectors
    except Exception as error:  # noqa: BLE001 — degrade gracefully, never crash the build
        print(f"Embedding failed ({error}); falling back to keyword-only index.")
        return []


def build() -> int:
    if not CONTENT_DIR.exists():
        print(f"No curriculum directory at {CONTENT_DIR}")
        return 1

    files = sorted(CONTENT_DIR.glob("*.md"))
    if not files:
        print(f"No .md files in {CONTENT_DIR}")
        return 1

    records: list[dict] = []
    for path in files:
        meta, body = parse_frontmatter(path.read_text(encoding="utf-8"))
        subject = meta.get("subject", "General")
        topic = meta.get("topic", path.stem)
        for index, passage in enumerate(chunk_passages(body)):
            records.append({
                "id": f"{path.stem}-{index}",
                "subject": subject,
                "topic": topic,
                "source": path.name,
                "text": passage,
                "keywords": keywords(passage),
            })

    print(f"Parsed {len(records)} passages from {len(files)} files.")

    client = load_openai_client()
    embeddings: list[list[float]] = []
    if client is not None:
        embeddings = embed_all(client, [record["text"] for record in records])

    if embeddings and len(embeddings) == len(records):
        for record, vector in zip(records, embeddings):
            record["embedding"] = vector
        mode = "semantic"
    else:
        mode = "keyword"

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(
            {
                "mode": mode,
                "embeddingModel": EMBEDDING_MODEL if mode == "semantic" else None,
                "passages": records,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)} ({mode} mode, {len(records)} passages).")
    return 0


if __name__ == "__main__":
    sys.exit(build())
