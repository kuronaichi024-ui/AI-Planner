import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getEnv } from '@/config/env';
import { sessionUserFromClaims, type SessionUser } from '@/lib/session';
import { AUTH_COOKIE_OPTIONS } from './cookie-options';
import type { Database } from './types';

export type SessionResult = {
  /**
   * The response to return when no redirect is needed. It carries any refreshed
   * session cookies and the cache headers the Supabase client asked for.
   */
  response: NextResponse;
  /** The signed-in user from verified JWT claims, or null. */
  user: SessionUser | null;
};

/**
 * Session refresh for the Next.js proxy (file convention `proxy.ts` from
 * Next.js 16). Follows the official Supabase SSR guide: build a client on the
 * request cookies, call getClaims() straight away (it verifies the token and
 * refreshes it when needed), and hand the refreshed cookies back on the response.
 */
export async function updateSession(request: NextRequest): Promise<SessionResult> {
  const env = getEnv();
  let response = NextResponse.next({ request });

  // A new client for every request; never keep one in a module-level variable.
  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          // Responses that set auth cookies must never be cached by a CDN.
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    }
  );

  // Do not run code between createServerClient and getClaims: a mistake here
  // can log users out at random (Supabase SSR guide).
  const { data } = await supabase.auth.getClaims();

  return { response, user: sessionUserFromClaims(data?.claims) };
}
