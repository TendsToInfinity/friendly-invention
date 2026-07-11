import { invalidPayload, parseJson, profileRequired, requireUserId, unauthorized } from '@/lib/api';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { mockTestAttemptSchema } from '@/lib/validation';
import { addAttempt, listAttempts } from '@/server/repository';

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const attempts = await listAttempts(userId);
  return Response.json({ attempts });
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const limited = rateLimit(`attempts:${userId}`, 30, 60_000);
  if (!limited.ok) return rateLimitResponse(limited);

  const parsed = mockTestAttemptSchema.safeParse(await parseJson(request));
  if (!parsed.success) return invalidPayload();

  const saved = await addAttempt(userId, parsed.data);
  if (!saved) return profileRequired();
  return Response.json({ ok: true }, { status: 201 });
}
