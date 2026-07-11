import { invalidPayload, parseJson, requireUserId, unauthorized } from '@/lib/api';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { mentorRequestSchema } from '@/lib/validation';
import { mentorReply } from '@/server/ai';

/**
 * Mentor chat endpoint. Authenticated only — signed-out demo users get the
 * client-side adaptive engine instead, so the (potentially paid) LLM is
 * never exposed to anonymous traffic.
 */
export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const limited = rateLimit(`mentor:${userId}`, 20, 60_000);
  if (!limited.ok) return rateLimitResponse(limited);

  const parsed = mentorRequestSchema.safeParse(await parseJson(request));
  if (!parsed.success) return invalidPayload();

  const reply = await mentorReply(userId, parsed.data.messages, parsed.data.subject);
  return Response.json({ reply });
}
