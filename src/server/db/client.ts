import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getEnv } from '@/config/env';
import { AUTH_COOKIE_OPTIONS } from './cookie-options';
import type { Database } from './types';

/**
 * The user-scoped Supabase client for Server Components, Server Actions and
 * Route Handlers. It uses the publishable key plus the signed-in user's
 * session cookies, so Postgres RLS applies to every query. The service_role
 * key is never used by app code.
 *
 * Always create a new client per request; never share one across requests.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getEnv();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render, where cookies are read-only.
            // Safe to ignore: the proxy refreshes the session on every request.
          }
        },
      },
    }
  );
}
