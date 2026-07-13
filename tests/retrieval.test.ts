// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatContext, formatStudentAnswer, retrievePassages } from '@/server/retrieval';

/**
 * Exercises the keyword retrieval path against the committed curriculum index
 * (data/knowledge-index.json). Semantic mode requires a network key and is
 * verified separately; the keyword path is what runs offline and in CI.
 */

describe('curriculum retrieval (RAG)', () => {
  it('retrieves the photosynthesis passage for a science question', async () => {
    const passages = await retrievePassages('how does photosynthesis work in plants', 'Science');
    expect(passages.length).toBeGreaterThan(0);
    expect(passages[0].subject).toBe('Science');
    expect(passages.some((p) => p.topic.toLowerCase().includes('photosynthesis'))).toBe(true);
  });

  it('retrieves the factorisation passage for a maths question', async () => {
    const passages = await retrievePassages('how do I factor a difference of squares', 'Mathematics');
    expect(passages[0].subject).toBe('Mathematics');
    expect(passages[0].text.toLowerCase()).toContain('difference');
  });

  it('returns nothing for an unrelated question rather than forcing a match', async () => {
    const passages = await retrievePassages('what is the weather today', 'General');
    expect(passages).toEqual([]);
  });

  it('formats a grounding block for the LLM prompt', async () => {
    const passages = await retrievePassages('explain the pH scale and acids', 'Science');
    const context = formatContext(passages);
    expect(context).toContain('curriculum excerpts');
    expect(context.toLowerCase()).toContain('ph');
  });

  it('formats a clean student-facing answer for the adaptive fallback', async () => {
    const passages = await retrievePassages('linear equation balance method', 'Mathematics');
    const answer = formatStudentAnswer(passages);
    expect(answer).toContain('syllabus says');
    expect(answer).toContain('Mathematics');
  });
});
