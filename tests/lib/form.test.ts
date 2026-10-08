import { describe, it, expect } from 'vitest';
import { formString, firstIssuePerField } from '@/lib/form';

describe('form', () => {
  describe('formString', () => {
    it('returns string value', () => {
      const fd = new FormData();
      fd.append('key', 'value');
      expect(formString(fd, 'key')).toBe('value');
    });

    it('returns empty for missing key', () => {
      const fd = new FormData();
      expect(formString(fd, 'missing')).toBe('');
    });

    it('returns empty for File', () => {
      const fd = new FormData();
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      fd.append('key', file);
      expect(formString(fd, 'key')).toBe('');
    });
  });

  describe('firstIssuePerField', () => {
    it('keeps first issue per field', () => {
      const issues = [
        { path: ['email'] as const, message: 'first email error' },
        { path: ['email'] as const, message: 'second email error' },
        { path: ['password'] as const, message: 'password error' },
      ];
      const result = firstIssuePerField({ issues });
      expect(result).toEqual({ email: 'first email error', password: 'password error' });
    });

    it('uses _form for root issues', () => {
      const issues = [{ path: [] as const, message: 'root error' }];
      const result = firstIssuePerField({ issues });
      expect(result).toEqual({ _form: 'root error' });
    });
  });
});