import { NextResponse, type NextRequest } from 'next/server';
import { resolveAuthRedirect } from '@/lib/auth-routes';
import { updateSession } from '@/server/db';

// Headers the Supabase client sets on responses that carry auth cookies.
const CACHE_HEADERS = ['cache-control', 'expires', 'pragma'];

/**
 * Next.js 16 `proxy` (formerly `middleware`): refreshes the Supabase session,
 * protects /projects/** and keeps signed-in users away from /login and /signup.
 *
 * Server Actions are POST requests to the route they live on and a proxy
 * matcher can skip them, so every action and layout also verifies the session
 * itself (see requireUser). This file is the first line of defence, not the only one.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const target = resolveAuthRedirect(request.nextUrl.pathname, user !== null);
  if (target === null) return response;

  const url = request.nextUrl.clone();
  url.pathname = target;
  url.search = '';
  const redirect = NextResponse.redirect(url);

  // A redirect is a new response: carry over refreshed session cookies and the
  // cache headers, or the browser and server can drift out of sync.
  for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
  for (const name of CACHE_HEADERS) {
    const value = response.headers.get(name);
    if (value !== null) redirect.headers.set(name, value);
  }
  return redirect;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
