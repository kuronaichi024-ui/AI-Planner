export type AuthFailureReason =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'email_in_use'
  | 'weak_password'
  | 'rate_limited'
  | 'signup_disabled'
  | 'invalid_email'
  | 'unknown';

export type AuthFailure = {
  reason: AuthFailureReason;
  /** Safe to show to the user. Never contains provider error text. */
  message: string;
};

/**
 * Maps a Supabase Auth error to a stable reason and a user-facing message.
 * Takes only the structural bits it needs (code and HTTP status).
 */
export function mapAuthError(error: { code?: string | undefined; status?: number | undefined }): AuthFailure {
  switch (error.code) {
    case 'invalid_credentials':
      return { reason: 'invalid_credentials', message: 'Invalid email or password.' };
    case 'email_not_confirmed':
      return {
        reason: 'email_not_confirmed',
        message: 'Confirm your email address first, then sign in.',
      };
    case 'user_already_exists':
    case 'email_exists':
      return {
        reason: 'email_in_use',
        message: 'An account with this email already exists. Sign in instead.',
      };
    case 'weak_password':
      return {
        reason: 'weak_password',
        message: 'That password is too weak. Choose a longer or less common one.',
      };
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return { reason: 'rate_limited', message: 'Too many attempts. Wait a minute and try again.' };
    case 'signup_disabled':
      return { reason: 'signup_disabled', message: 'Sign-ups are disabled for this project.' };
    case 'email_address_invalid':
    case 'validation_failed':
      return { reason: 'invalid_email', message: 'Enter a valid email address.' };
    default:
      if (error.status === 429) {
        return { reason: 'rate_limited', message: 'Too many attempts. Wait a minute and try again.' };
      }
      return { reason: 'unknown', message: 'Something went wrong. Try again.' };
  }
}
