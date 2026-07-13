# Mentora AI — Curriculum RAG Pipeline

This folder holds the Python pipeline that grounds the AI mentor in **your own
curriculum** (Retrieval-Augmented Generation). This is **not model training** —
it teaches an existing model (OpenAI) to answer from your syllabus instead of
generic internet knowledge. That is the right, affordable way to make the
mentor domain-smart at this stage.

## How it fits together

```
content/curriculum/*.md      →  ml/build_index.py  →  data/knowledge-index.json
   (your syllabus notes)         (chunk + embed)        (searchable index)
                                                              │
                                                              ▼
   student asks a question  →  server/retrieval.ts  →  top passages injected
                                (semantic or keyword)     into the mentor's prompt
```

- **Offline step (Python, this folder):** run whenever curriculum content
  changes. Splits each Markdown file into passages and, if an OpenAI key is
  present, computes an embedding per passage for semantic search.
- **Request step (TypeScript, `server/retrieval.ts`):** at chat time, finds the
  passages most relevant to the student's question and adds them to the prompt.

## Adding your own content

Drop Markdown files into `content/curriculum/`. Give each a small frontmatter
header so passages are tagged:

```markdown
---
subject: Science
topic: The Human Eye
grade: "10"
board: CBSE
---

# The Human Eye
...your notes...
```

## Running the pipeline

```bash
cd ml
python3 -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt

# Semantic search (recommended) — needs your key:
export OPENAI_API_KEY=sk-...
python build_index.py

# OR keyword-only (no key, no network) — still fully functional:
python build_index.py
```

This writes `data/knowledge-index.json`. Commit it so the deployed app ships
with the index. Re-run whenever you add or edit curriculum files.

## Two modes, chosen automatically

| | Semantic mode | Keyword mode |
|---|---|---|
| When | `OPENAI_API_KEY` set at build time | no key |
| Matching | meaning-based (embeddings + cosine similarity) | word-overlap |
| Quality | best — understands paraphrases | good for direct terms |
| Cost | ~fractions of a cent for the whole corpus | free |

The app reads whichever index you built and adapts. Keyword mode needs no
network, which is why tests and CI use it.

## Cost note

Embeddings use `text-embedding-3-small` — cents per thousands of passages.
At request time the mentor embeds one short question per message (also
fractions of a cent). This is dramatically cheaper than training or
fine-tuning any model.
