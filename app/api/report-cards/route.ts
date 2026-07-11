import { invalidPayload, parseJson, profileRequired, requireUserId, unauthorized } from '@/lib/api';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { reportCardSchema } from '@/lib/validation';
import { createReportCard, listReportCards } from '@/server/repository';

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const reportCards = await listReportCards(userId);
  return Response.json({ reportCards });
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const limited = rateLimit(`report:${userId}`, 30, 60_000);
  if (!limited.ok) return rateLimitResponse(limited);

  const parsed = reportCardSchema.safeParse(await parseJson(request));
  if (!parsed.success) return invalidPayload();

  const reportCard = await createReportCard(userId, parsed.data);
  if (!reportCard) return profileRequired();
  return Response.json({ reportCard }, { status: 201 });
}
