// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Verifies the server-side LLM integration without calling OpenAI:
 * request shape (endpoint, auth header, safety prompt, message mapping),
 * provider selection via env, and the adaptive fallback on failure.
 */

vi.mock('@/server/repository', () => ({
  getStudentProfile: vi.fn(async () => ({
    id: 'u1',
    name: 'Aarav',
    age: 15,
    academic: {
      classGrade: '10',
      board: 'CBSE',
      country: 'India',
      subjects: ['Mathematics'],
      strongSubjects: ['Mathematics'],
      improvementSubjects: ['Chemistry'],
    },
    interests: [],
    careerInterests: [],
    weeklyStudyHours: 14,
    goal: 'Do well',
    notifications: true,
    theme: 'system',
  })),
  getLatestReportCard: vi.fn(async () => ({
    id: 'r1',
    createdAt: new Date().toISOString(),
    marks: [{ subject: 'Mathematics', obtained: 92, maximum: 100 }],
  })),
  listAttempts: vi.fn(async () => []),
}));

const question = (content: string) => [
  { id: 'm1', role: 'student' as const, content, createdAt: new Date().toISOString() },
];

describe('server mentor provider', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('AI_PROVIDER', 'openai');
    vi.stubEnv('OPENAI_API_KEY', 'test-key');
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('sends the question to OpenAI with the safety prompt and student context', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: 'A black hole is…' } }] })),
    );
    const { mentorReply } = await import('@/server/ai');

    const reply = await mentorReply('u1', question('What is a black hole?'), 'Science');

    expect(reply).toBe('A black hole is…');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.openai.com/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');

    const body = JSON.parse(init.body as string) as {
      messages: { role: string; content: string }[];
    };
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[0].content).toContain('age-appropriate');
    expect(body.messages[0].content).toContain('Aarav');
    expect(body.messages[0].content).toContain('Chemistry');
    expect(body.messages.at(-1)).toEqual({ role: 'user', content: 'What is a black hole?' });
  });

  it('falls back to the adaptive engine when the LLM call fails', async () => {
    fetchMock.mockRejectedValue(new Error('network blocked'));
    const { mentorReply } = await import('@/server/ai');

    const reply = await mentorReply('u1', question('explain photosynthesis'), 'Science');

    expect(reply).toContain('**Photosynthesis**');
  });

  it('skips the LLM entirely when no key is configured', async () => {
    vi.stubEnv('AI_PROVIDER', 'mock');
    const { mentorReply } = await import('@/server/ai');

    const reply = await mentorReply('u1', question('hello'), 'General');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(reply).toContain('Aarav');
  });
});
