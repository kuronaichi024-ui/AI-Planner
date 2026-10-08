import { describe, it, expect } from 'vitest';
import { sessionUserFromClaims, type SessionUser } from '@/lib/session';

describe('session', () => {
  describe('sessionUserFromClaims', () => {
    it('valid claims return user', () => {
      const result = sessionUserFromClaims({ sub: 'user-123', email: 'a@b.c' });
      expect(result).toEqual({ id: 'user-123', email: 'a@b.c' } satisfies SessionUser);
    });

    it('null email becomes null', () => {
      const result = sessionUserFromClaims({ sub: 'user-123', email: '' });
      expect(result).toEqual({ id: 'user-123', email: null } satisfies SessionUser);
    });

    it('missing email becomes null', () => {
      const result = sessionUserFromClaims({ sub: 'user-123' });
      expect(result).toEqual({ id: 'user-123', email: null } satisfies SessionUser);
    });

    it('missing sub returns null', () => {
      const result = sessionUserFromClaims({ email: 'a@b.c' });
      expect(result).toBeNull();
    });

    it('empty sub returns null', () => {
      const result = sessionUserFromClaims({ sub: '', email: 'a@b.c' });
      expect(result).toBeNull();
    });

    it('non-object returns null', () => {
      expect(sessionUserFromClaims(null)).toBeNull();
      expect(sessionUserFromClaims('string')).toBeNull();
      expect(sessionUserFromClaims(123)).toBeNull();
    });
  });
});