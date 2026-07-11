import type { ChatMessage } from '@/types/models';

/**
 * Mentor-response provider abstraction. The UI depends only on this
 * interface, so the mock can be swapped for a real provider later.
 *
 * NOTE: a real OpenAI provider must live behind a server-side API route.
 * Never reference API keys from code that ships in the client bundle.
 */
export interface AIMentorProvider {
  reply(messages: ChatMessage[], subject: string): Promise<string>;
}

const CANNED_REPLIES: Array<{ match: RegExp; reply: string }> = [
  {
    match: /photosynthesis/,
    reply:
      '**Photosynthesis** is how plants make food using sunlight, water, and carbon dioxide. Try remembering: light + CO₂ + water → glucose + oxygen.',
  },
  {
    match: /marks|falling/,
    reply:
      'Marks can dip for many reasons—concept gaps, exam strategy, or practice style. Let’s review errors kindly, revise basics, and solve 5 targeted questions daily.',
  },
  {
    match: /career/,
    reply:
      'Careers using mathematics include engineering, data science, finance, architecture, research, and economics. Treat this as exploration—discuss with parents, teachers, and counselors.',
  },
  {
    match: /quiz/,
    reply: 'Quick quiz: If x/3 = 6, what is x? Answer first, then I’ll explain.',
  },
];

const REPLY_DELAY_MS = 550;

/** Deterministic, offline mentor used by the MVP. */
export class MockAIProvider implements AIMentorProvider {
  async reply(messages: ChatMessage[], subject: string): Promise<string> {
    const text = messages.at(-1)?.content.toLowerCase() ?? '';
    await new Promise((resolve) => setTimeout(resolve, REPLY_DELAY_MS));

    const canned = CANNED_REPLIES.find(({ match }) => match.test(text));
    if (canned) return canned.reply;

    return `For ${subject}, start with one clear goal, revise the concept, practice examples, and reflect on mistakes. What topic should we break down next?`;
  }
}

/** Single shared provider instance used across the app. */
export const aiProvider: AIMentorProvider = new MockAIProvider();
