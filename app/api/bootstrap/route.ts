import { requireUserId, unauthorized } from '@/lib/api';
import {
  getChatHistory,
  getCurrentStudyPlan,
  getLatestReportCard,
  getStudentProfile,
  listAttempts,
} from '@/server/repository';

/**
 * One-shot hydration payload: everything the client cache needs after
 * sign-in, in a single round trip. Signed-out visitors get 401, which the
 * client treats as "demo mode".
 */
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return unauthorized();

  const [student, report, chat, plan, attempts] = await Promise.all([
    getStudentProfile(userId),
    getLatestReportCard(userId),
    getChatHistory(userId),
    getCurrentStudyPlan(userId),
    listAttempts(userId),
  ]);

  return Response.json({ student, report, chat, plan, attempts });
}
