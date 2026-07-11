import { invalidPayload, parseJson, profileRequired, requireUserId, unauthorized } from '@/lib/api';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { studyPlanSchema } from '@/lib/validation';
import { getCurrentStudyPlan, saveStudyPlan } from '@/server/repository';

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const plan = await getCurrentStudyPlan(userId);
  return Response.json({ plan });
}

export async function PUT(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const limited = rateLimit(`plan:${userId}`, 60, 60_000);
  if (!limited.ok) return rateLimitResponse(limited);

  const parsed = studyPlanSchema.safeParse(await parseJson(request));
  if (!parsed.success) return invalidPayload();

  const saved = await saveStudyPlan(userId, parsed.data);
  if (!saved) return profileRequired();
  return Response.json({ ok: true });
}
