/**
 * In-memory fixed-window rate limiter — a PLACEHOLDER suitable for a single
 * server process. It resets on deploy and does not share state across
 * serverless instances, so before real traffic replace it with a durable
 * store (e.g. @upstash/ratelimit + Redis) behind this same function
 * signature. API routes already call it, so only this file changes.
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

export type RateLimitResult = { ok: boolean; remaining: number; resetAt: number };

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const current = windows.get(key);

  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  current.count += 1;
  if (windows.size > 10_000) {
    // Prevent unbounded growth if many unique keys appear between deploys.
    for (const [k, w] of windows) {
      if (w.resetAt <= now) windows.delete(k);
    }
  }

  return {
    ok: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    resetAt: current.resetAt,
  };
}

/** Standard 429 body for exceeded limits. */
export function rateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    { error: 'Too many requests. Please try again later.' },
    {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)) },
    },
  );
}
