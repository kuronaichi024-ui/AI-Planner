import 'server-only';
import { redirect } from 'next/navigation';
import { LOGIN_PATH } from '@/lib/auth-routes';
import type { SessionUser } from '@/lib/session';
import { getSessionUser } from '@/server/db';

/**
 * Returns the signed-in user or redirects to /login. Call it in every layout
 * and Server Action that needs a user: the proxy alone is not enough because it
 * can be skipped (see the note in src/proxy.ts).
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(LOGIN_PATH);
  return user;
}
