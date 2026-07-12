// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { config, proxy } from '@/proxy';

/**
 * Guards the public entry points. Onboarding and the auth pages must never be
 * behind the sign-in redirect, or new visitors cannot create a profile.
 */

function fakeRequest(pathname: string, cookies: Record<string, string> = {}) {
  return {
    nextUrl: { pathname },
    url: `http://localhost:3000${pathname}`,
    cookies: {
      has: (name: string) => name in cookies,
      get: (name: string) => (name in cookies ? { value: cookies[name] } : undefined),
    },
  } as unknown as Parameters<typeof proxy>[0];
}

describe('route-protection proxy', () => {
  it('does NOT protect onboarding — it is the public profile-creation entry point', () => {
    expect(config.matcher).not.toContain('/onboarding/:path*');
  });

  it('redirects signed-out visitors away from protected routes', () => {
    const response = proxy(fakeRequest('/dashboard'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/sign-in');
  });

  it('lets a local/demo-cookie user through', () => {
    const response = proxy(fakeRequest('/dashboard', { 'mentora-demo': '1' }));
    // NextResponse.next() has no redirect location
    expect(response.headers.get('location')).toBeNull();
  });

  it('lets an authenticated user through', () => {
    const response = proxy(fakeRequest('/mentor', { 'authjs.session-token': 'abc' }));
    expect(response.headers.get('location')).toBeNull();
  });

  it('protects the core feature routes', () => {
    for (const route of ['/dashboard', '/mentor', '/mock-test', '/study-plan', '/career', '/profile', '/report-card']) {
      expect(config.matcher).toContain(`${route}/:path*`);
    }
  });
});
