import { adaptiveReply, type MentorContext } from '@/lib/mentor-knowledge';
import { getMode, repo } from '@/services/storage';
import type { ChatMessage } from '@/types/models';

/**
 * Client-side mentor provider.
 *
 * Signed-in users are answered by POST /api/mentor — a real LLM when the
 * server has a key, otherwise the server-side adaptive engine with the
 * student's database context. Demo users (and any server failure) fall back
 * to the same adaptive engine running locally against cached data, so the
 * mentor always answers. No API keys ever exist in this bundle.
 */
export interface AIMentorProvider {
  reply(messages: ChatMessage[], subject: string): Promise<string>;
}

const THINKING_DELAY_MS = 450;

function localContext(): MentorContext {
  const student = repo.student();
  const report = repo.report();
  return {
    studentName: student?.name,
    weakSubjects: student?.academic.improvementSubjects ?? [],
    strongSubjects: student?.academic.strongSubjects ?? [],
    marks: report.marks,
    attemptCount: repo.attempts().length,
  };
}

/** Offline/demo mentor: the adaptive engine over locally cached student data. */
export class AdaptiveMockProvider implements AIMentorProvider {
  async reply(messages: ChatMessage[], subject: string): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, THINKING_DELAY_MS));
    return adaptiveReply(messages, subject, localContext());
  }
}

class ServerFirstProvider implements AIMentorProvider {
  private fallback = new AdaptiveMockProvider();

  async reply(messages: ChatMessage[], subject: string): Promise<string> {
    if (getMode() === 'cloud') {
      try {
        const response = await fetch('/api/mentor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, messages: messages.slice(-20) }),
        });
        if (response.ok) {
          const body = (await response.json()) as { reply: string };
          return body.reply;
        }
      } catch {
        // Network hiccup — the local engine takes over below.
      }
    }
    return this.fallback.reply(messages, subject);
  }
}

/** Single shared provider instance used across the app. */
export const aiProvider: AIMentorProvider = new ServerFirstProvider();
