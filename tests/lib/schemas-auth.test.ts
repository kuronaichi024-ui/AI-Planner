import { describe, it, expect } from 'vitest';
import {
  signUpSchema,
  signInSchema,
  type SignUpInput,
  type SignInInput,
} from '@/lib/schemas/auth';

describe('schemas/auth', () => {
  describe('signUpSchema', () => {
    it('accepts valid email and password', () => {
      const result = signUpSchema.safeParse({
        email: ' User@Example.COM ',
        password: '12345678',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
        expect(result.data.password).toBe('12345678');
      }
    });

    it('rejects invalid email', () => {
      const result = signUpSchema.safeParse({ email: 'not-email', password: '12345678' });
      expect(result.success).toBe(false);
    });

    it('rejects empty email', () => {
      const result = signUpSchema.safeParse({ email: '', password: '12345678' });
      expect(result.success).toBe(false);
    });

    it('rejects password shorter than 8', () => {
      const result = signUpSchema.safeParse({ email: 'a@b.c', password: '1234567' });
      expect(result.success).toBe(false);
    });

    it('accepts password of exactly 8 characters', () => {
      const result = signUpSchema.safeParse({ email: 'user@example.com', password: '12345678' });
      expect(result.success).toBe(true);
    });

    it('accepts password of 72 characters', () => {
      const result = signUpSchema.safeParse({
        email: 'user@example.com',
        password: 'a'.repeat(72),
      });
      expect(result.success).toBe(true);
    });

    it('rejects password longer than 72', () => {
      const result = signUpSchema.safeParse({
        email: 'a@b.c',
        password: 'a'.repeat(73),
      });
      expect(result.success).toBe(false);
    });
  });

  describe('signInSchema', () => {
    it('accepts valid email and password', () => {
      const result = signInSchema.safeParse({
        email: ' User@Example.COM ',
        password: 'anypass',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('user@example.com');
      }
    });

    it('rejects short password', () => {
      const result = signInSchema.safeParse({ email: 'a@b.c', password: '' });
      expect(result.success).toBe(false);
    });

    it('accepts password of any length >= 1', () => {
      const result = signInSchema.safeParse({ email: 'user@example.com', password: 'x' });
      expect(result.success).toBe(true);
    });
  });
});
