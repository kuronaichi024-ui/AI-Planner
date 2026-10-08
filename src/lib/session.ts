import { z } from 'zod';

export type SessionUser = {
  id: string;
  email: string | null;
};

const claimsSchema = z.object({
  sub: z.string().min(1),
  email: z.string().optional(),
});

/**
 * Builds the signed-in user from verified JWT claims (the result of
 * supabase.auth.getClaims()). Returns null when the claims carry no user.
 */
export function sessionUserFromClaims(claims: unknown): SessionUser | null {
  const parsed = claimsSchema.safeParse(claims);
  if (!parsed.success) return null;
  const email = parsed.data.email;
  return { id: parsed.data.sub, email: email && email.length > 0 ? email : null };
}
