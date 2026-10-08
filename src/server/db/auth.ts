import 'server-only';
import { cache } from 'react';
import { sessionUserFromClaims, type SessionUser } from '@/lib/session';
import { mapAuthError, type AuthFailure } from './auth-errors';
import { createSupabaseServerClient } from './client';

export type AuthResult =
  | {
      ok: true;
      /** False when the project requires email confirmation: the account exists but has no session yet. */
      signedIn: boolean;
    }
  | ({ ok: false } & AuthFailure);

/**
 * The signed-in user, from verified JWT claims (never from getSession(), which
 * trusts the cookie). Deduplicated within one request.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  return sessionUserFromClaims(data?.claims);
});

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, ...mapAuthError(error) };
  return { ok: true, signedIn: true };
}

export async function signUpWithPassword(email: string, password: string): Promise<AuthResult> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, ...mapAuthError(error) };
  return { ok: true, signedIn: data.session !== null };
}

/** Ends this browser's session only; the user's other devices stay signed in. */
export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: 'local' });
}
