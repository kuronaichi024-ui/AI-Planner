import { describe, it, expect } from 'vitest';
import { mapAuthError, type AuthFailureReason } from '@/server/db/auth-errors';

describe('auth-errors', () => {
  it.each([
    { code: 'invalid_credentials', expected: 'invalid_credentials' as AuthFailureReason },
    { code: 'email_not_confirmed', expected: 'email_not_confirmed' },
    { code: 'user_already_exists', expected: 'email_in_use' },
    { code: 'email_exists', expected: 'email_in_use' },
    { code: 'weak_password', expected: 'weak_password' },
    { code: 'over_request_rate_limit', expected: 'rate_limited' },
    { code: 'over_email_send_rate_limit', expected: 'rate_limited' },
    { code: 'signup_disabled', expected: 'signup_disabled' },
    { code: 'email_address_invalid', expected: 'invalid_email' },
    { code: 'validation_failed', expected: 'invalid_email' },
  ])('maps $code to $expected', ({ code, expected }) => {
    const result = mapAuthError({ code });
    expect(result.reason).toBe(expected);
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
    // no provider text leaks
    expect(result.message.toLowerCase()).not.toContain('supabase');
    expect(result.message.toLowerCase()).not.toContain('postgres');
  });

  it('status 429 -> rate_limited', () => {
    const result = mapAuthError({ code: 'other', status: 429 });
    expect(result.reason).toBe('rate_limited');
  });

  it('unknown code -> unknown', () => {
    const result = mapAuthError({ code: 'some_random_code', status: 500 });
    expect(result.reason).toBe('unknown');
  });

  it('messages never contain provider text', () => {
    const allResults = [
      { code: 'invalid_credentials' },
      { code: 'email_not_confirmed' },
      { code: 'user_already_exists' },
      { code: 'weak_password' },
      { code: 'over_request_rate_limit' },
      { code: 'signup_disabled' },
      { code: 'email_address_invalid' },
      { code: 'unknown_code', status: 500 },
    ].map(mapAuthError);

    for (const r of allResults) {
      const msg = r.message.toLowerCase();
      expect(msg).not.toContain('supabase');
      expect(msg).not.toContain('postgres');
      expect(msg).not.toContain('database');
      expect(msg).not.toContain('sql');
    }
  });
});