import { invalidPayload, parseJson, requireUserId, unauthorized } from '@/lib/api';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { studentProfileSchema } from '@/lib/validation';
import { getStudentProfile, upsertStudentProfile } from '@/server/repository';

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const student = await getStudentProfile(userId);
  return Response.json({ student });
}

export async function PUT(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const limited = rateLimit(`profile:${userId}`, 30, 60_000);
  if (!limited.ok) return rateLimitResponse(limited);

  const parsed = studentProfileSchema.safeParse(await parseJson(request));
  if (!parsed.success) return invalidPayload();

  const student = await upsertStudentProfile(userId, parsed.data);
  return Response.json({ student });
}
