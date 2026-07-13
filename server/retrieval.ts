import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Curriculum retrieval (the "R" in RAG). At request time this finds the
 * passages from data/knowledge-index.json most relevant to a student's
 * question, so the mentor answers from YOUR syllabus instead of generic
 * knowledge.
 *
 * Two modes, chosen automatically from what the index contains:
 *  - semantic: if the index was built with embeddings AND an OpenAI key is
 *    present, the query is embedded and ranked by cosine similarity.
 *  - keyword: otherwise, token-overlap scoring — no network, always works.
 *
 * The index is generated offline by ml/build_index.py.
 */

export type Passage = {
  id: string;
  subject: string;
  topic: string;
  source: string;
  text: string;
  keywords: string[];
  embedding?: number[];
};

type KnowledgeIndex = {
  mode: 'semantic' | 'keyword';
  embeddingModel: string | null;
  passages: Passage[];
};

const INDEX_PATH = path.join(process.cwd(), 'data', 'knowledge-index.json');
const EMBEDDING_URL = 'https://api.openai.com/v1/embeddings';
const EMBED_TIMEOUT_MS = 6_000;
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'is', 'are', 'it', 'its',
  'for', 'on', 'with', 'as', 'by', 'that', 'this', 'my', 'me', 'i', 'how',
  'what', 'why', 'do', 'does', 'can', 'explain', 'tell', 'about',
]);

let indexPromise: Promise<KnowledgeIndex | null> | null = null;

async function loadIndex(): Promise<KnowledgeIndex | null> {
  indexPromise ??= readFile(INDEX_PATH, 'utf-8')
    .then((raw) => JSON.parse(raw) as KnowledgeIndex)
    .catch(() => null);
  return indexPromise;
}

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z0-9-]+/g) ?? []).filter(
    (token) => token.length > 2 && !STOPWORDS.has(token),
  );
}

function keywordScore(queryTokens: string[], passage: Passage, subject: string): number {
  const bag = new Set(passage.keywords);
  let score = queryTokens.reduce((total, token) => total + (bag.has(token) ? 1 : 0), 0);
  // Light boost when the passage matches the active chat subject.
  if (passage.subject.toLowerCase() === subject.toLowerCase()) score += 0.5;
  return score;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom ? dot / denom : 0;
}

async function embedQuery(query: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), EMBED_TIMEOUT_MS);
  try {
    const response = await fetch(EMBEDDING_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
        input: query,
      }),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: { embedding?: number[] }[] };
    return body.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/** Ranks passages against the query and returns the top matches. */
export async function retrievePassages(
  query: string,
  subject: string,
  topK = 3,
): Promise<Passage[]> {
  const index = await loadIndex();
  if (!index || index.passages.length === 0) return [];

  const hasEmbeddings = index.mode === 'semantic' && index.passages.every((p) => p.embedding?.length);
  if (hasEmbeddings) {
    const queryVector = await embedQuery(query);
    if (queryVector) {
      return [...index.passages]
        .map((passage) => ({ passage, score: cosineSimilarity(queryVector, passage.embedding!) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .filter((entry) => entry.score > 0.15)
        .map((entry) => entry.passage);
    }
  }

  // Keyword fallback (offline-safe).
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];
  return [...index.passages]
    .map((passage) => ({ passage, score: keywordScore(queryTokens, passage, subject) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((entry) => entry.passage);
}

/** Formats retrieved passages as a grounding block for the LLM system prompt. */
export function formatContext(passages: Passage[]): string {
  if (passages.length === 0) return '';
  const blocks = passages
    .map((passage) => `[${passage.subject} — ${passage.topic}]\n${passage.text}`)
    .join('\n\n');
  return `Use the following curriculum excerpts as your primary source when they are relevant. If they do not cover the question, answer from general knowledge and say so.\n\n${blocks}`;
}

/** Formats the single best passage as a direct, student-facing answer (adaptive fallback). */
export function formatStudentAnswer(passages: Passage[]): string {
  const best = passages[0];
  if (!best) return '';
  return `Here's what your **${best.subject}** syllabus says about **${best.topic}**:\n\n${best.text}`;
}
