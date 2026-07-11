/** Generates a unique id, preferring the cryptographically strong Web Crypto API. */
export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

/** Returns `obtained` as a rounded percentage of `max`, guarding against division by zero. */
export function pct(obtained: number, max: number): number {
  return max ? Math.round((obtained / max) * 100) : 0;
}

/** Joins truthy class names, so conditional classes can be passed as `condition && 'class'`. */
export function cn(...values: (string | false | undefined)[]): string {
  return values.filter(Boolean).join(' ');
}
