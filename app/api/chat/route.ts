import { invalidPayload, parseJson, profileRequired, requireUserId, unauthorized } from '@/lib/api';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { chatHistorySchema } from '@/lib/validation';
import { getChatHistory, replaceChatHistory } from '@/server/repository';

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const messages = await getChatHistory(userId);
  return Response.json({ messages });
}

export async function PUT(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const limited = rateLimit(`chat:${userId}`, 60, 60_000);
  if (!limited.ok) return rateLimitResponse(limited);

  const parsed = chatHistorySchema.safeParse(await parseJson(request));
  if (!parsed.success) return invalidPayload();

  const saved = await replaceChatHistory(userId, parsed.data);
  if (!saved) return profileRequired();
  return Response.json({ ok: true });
}
