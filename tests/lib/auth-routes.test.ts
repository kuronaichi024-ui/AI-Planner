import { describe, it, expect } from 'vitest';
import {
  isProtectedPath,
  isAuthPagePath,
  resolveAuthRedirect,
} from '@/lib/auth-routes';

describe('auth-routes', () => {
  describe('isProtectedPath', () => {
    it('true for /projects', () => {
      expect(isProtectedPath('/projects')).toBe(true);
    });

    it('true for /projects/anything', () => {
      expect(isProtectedPath('/projects/x')).toBe(true);
      expect(isProtectedPath('/projects/x/y')).toBe(true);
    });

    it('false for /projectsfoo', () => {
      expect(isProtectedPath('/projectsfoo')).toBe(false);
    });

    it('false for /', () => {
      expect(isProtectedPath('/')).toBe(false);
    });
  });

  describe('isAuthPagePath', () => {
    it('true for /login and /signup', () => {
      expect(isAuthPagePath('/login')).toBe(true);
      expect(isAuthPagePath('/signup')).toBe(true);
    });

    it('true for paths starting with them', () => {
      expect(isAuthPagePath('/login/foo')).toBe(true);
      expect(isAuthPagePath('/signup/bar')).toBe(true);
    });

    it('false for /projects', () => {
      expect(isAuthPagePath('/projects')).toBe(false);
    });
  });

  describe('resolveAuthRedirect', () => {
    it('signed-out on protected -> /login', () => {
      expect(resolveAuthRedirect('/projects', false)).toBe('/login');
      expect(resolveAuthRedirect('/projects/abc', false)).toBe('/login');
    });

    it('signed-in on auth page -> /projects', () => {
      expect(resolveAuthRedirect('/login', true)).toBe('/projects');
      expect(resolveAuthRedirect('/signup', true)).toBe('/projects');
    });

    it('null otherwise', () => {
      expect(resolveAuthRedirect('/projects', true)).toBeNull();
      expect(resolveAuthRedirect('/', false)).toBeNull();
      expect(resolveAuthRedirect('/login', false)).toBeNull();
    });
  });
});