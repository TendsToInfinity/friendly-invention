import type { NextRequest } from 'next/server';
import { rateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { credentialsSchema } from '@/lib/validation';
import { createUser, emailExists } from '@/server/repository';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const limited = rateLimit(`signup:${ip}`, 5, 60_000);
  if (!limited.ok) return rateLimitResponse(limited);

  const body = await request.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Enter a valid email and a password of at least 8 characters.' },
      { status: 400 },
    );
  }

  if (await emailExists(parsed.data.email)) {
    return Response.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const user = await createUser(parsed.data.email, parsed.data.password);
  return Response.json({ id: user.id, email: user.email }, { status: 201 });
}
