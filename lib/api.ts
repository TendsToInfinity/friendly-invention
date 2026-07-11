import { auth } from '@/auth';

/**
 * Shared helpers for route handlers. Every API route follows the same shape:
 * authenticate → rate-limit (writes) → validate with Zod → call repository
 * scoped to the session userId.
 */

export async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export const unauthorized = () =>
  Response.json({ error: 'Authentication required.' }, { status: 401 });

export const invalidPayload = () =>
  Response.json({ error: 'Invalid request payload.' }, { status: 400 });

/** Writes to student data require a profile; the client onboards first. */
export const profileRequired = () =>
  Response.json({ error: 'Complete onboarding before saving data.' }, { status: 409 });

export async function parseJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}
