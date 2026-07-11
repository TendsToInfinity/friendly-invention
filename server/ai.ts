import { adaptiveReply, stripMarkers, type MentorContext } from '@/lib/mentor-knowledge';
import { getLatestReportCard, getStudentProfile, listAttempts } from '@/server/repository';
import type { ChatMessage } from '@/types/models';

/**
 * Server-side mentor. When AI_PROVIDER=openai and OPENAI_API_KEY are set,
 * questions go to a real LLM with a student-safety system prompt and the
 * student's own context (profile + marks) so answers are personalized.
 * Without a key — or on any LLM failure — the adaptive engine answers, so
 * the mentor never goes silent. The key never leaves the server.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const LLM_TIMEOUT_MS = 20_000;
const MAX_HISTORY = 12;

function safetySystemPrompt(context: MentorContext, subject: string): string {
  const marksSummary = context.marks.length
    ? context.marks.map((mark) => `${mark.subject}: ${mark.obtained}/${mark.maximum}`).join(', ')
    : 'no marks saved yet';
  return [
    'You are Mo, a warm, encouraging study mentor for school students (may be minors).',
    'Rules you must always follow:',
    '- Keep every answer age-appropriate, kind, and encouraging; never shame the student.',
    '- Explain concepts step by step in short paragraphs or lists, in Markdown, under 250 words.',
    '- For career, health, or wellbeing topics, present options as exploration and recommend discussing with parents, teachers, or qualified counselors.',
    '- Refuse anything unrelated to learning, wellbeing, or study planning; gently redirect to studies.',
    '- Never request or reveal personal contact information.',
    `Current chat subject: ${subject}.`,
    `Student context — name: ${context.studentName ?? 'unknown'}; strong subjects: ${context.strongSubjects.join(', ') || 'unknown'}; focus subjects: ${context.weakSubjects.join(', ') || 'unknown'}; latest marks: ${marksSummary}; mock tests taken: ${context.attemptCount}.`,
    'Use the context to personalize answers (reference their focus subjects when relevant).',
  ].join('\n');
}

async function llmReply(
  messages: ChatMessage[],
  subject: string,
  context: MentorContext,
): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (process.env.AI_PROVIDER !== 'openai' || !apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          { role: 'system', content: safetySystemPrompt(context, subject) },
          ...messages.slice(-MAX_HISTORY).map((message) => ({
            role: message.role === 'mentor' ? 'assistant' : 'user',
            content: stripMarkers(message.content),
          })),
        ],
      }),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    return body.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function buildContext(userId: string): Promise<MentorContext> {
  const [student, report, attempts] = await Promise.all([
    getStudentProfile(userId),
    getLatestReportCard(userId),
    listAttempts(userId),
  ]);
  return {
    studentName: student?.name,
    weakSubjects: student?.academic.improvementSubjects ?? [],
    strongSubjects: student?.academic.strongSubjects ?? [],
    marks: report?.marks ?? [],
    attemptCount: attempts.length,
  };
}

export async function mentorReply(
  userId: string,
  messages: ChatMessage[],
  subject: string,
): Promise<string> {
  const context = await buildContext(userId);
  const fromLlm = await llmReply(messages, subject, context);
  return fromLlm ?? adaptiveReply(messages, subject, context);
}
