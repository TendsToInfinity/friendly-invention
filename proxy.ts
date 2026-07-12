import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route-protection proxy (Next 16 convention): a fast cookie-presence check that redirects
 * visitors with no session to /sign-in. The demo/local cookie (set by "Load
 * Demo Account" AND by completing onboarding) bypasses it, so local-only
 * users keep full access without signing up.
 *
 * IMPORTANT: /onboarding is intentionally NOT protected — it is a public
 * entry point where new visitors create their first profile. Protecting it
 * would trap new users in a sign-in redirect loop before they can start.
 *
 * This is UX-level protection only — cookie presence is not verified here.
 * Real authorization happens in every API route via auth(), which validates
 * the JWT and scopes all queries to the session user.
 */

const SESSION_COOKIES = ['authjs.session-token', '__Secure-authjs.session-token'];
const DEMO_COOKIE = 'mentora-demo';

export function proxy(request: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  const isDemo = request.cookies.get(DEMO_COOKIE)?.value === '1';

  if (hasSession || isDemo) return NextResponse.next();

  const signInUrl = new URL('/sign-in', request.url);
  signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/report-card/:path*',
    '/mentor/:path*',
    '/mock-test/:path*',
    '/study-plan/:path*',
    '/career/:path*',
    '/profile/:path*',
  ],
};
