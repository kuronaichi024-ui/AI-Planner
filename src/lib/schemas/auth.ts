import { z } from 'zod';

export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
// Supabase Auth rejects passwords longer than 72 characters (bcrypt limit).
export const PASSWORD_MAX_LENGTH = 72;

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email('Enter a valid email address.').max(EMAIL_MAX_LENGTH, 'That email address is too long.'));

export const signInSchema = z.object({
  email: emailField,
  // No minimum on sign-in: an existing account is checked by the auth server, not by us.
  password: z
    .string()
    .min(1, 'Enter your password.')
    .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters.`),
});

export const signUpSchema = z.object({
  email: emailField,
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `Use at least ${PASSWORD_MIN_LENGTH} characters.`)
    .max(PASSWORD_MAX_LENGTH, `Use at most ${PASSWORD_MAX_LENGTH} characters.`),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
