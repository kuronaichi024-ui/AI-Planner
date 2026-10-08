import { describe, it, expect } from 'vitest';
import {
  deriveProjectName,
  newProjectSchema,
  renameProjectSchema,
  isDeleteConfirmed,
} from '@/lib/schemas/project';

describe('schemas/project', () => {
  describe('deriveProjectName', () => {
    it('collapses whitespace', () => {
      expect(deriveProjectName('  a   b  ')).toBe('a b');
    });

    it('cuts at 60 code points', () => {
      const long = 'a'.repeat(70);
      expect(deriveProjectName(long)).toBe('a'.repeat(60));
    });

    it('does not split a single emoji', () => {
      const text = 'a'.repeat(59) + '😀';
      const result = deriveProjectName(text);
      expect(Array.from(result).length).toBeLessThanOrEqual(60);
      expect(result).toBe(text);
    });

    it('trims after cutting', () => {
      const text = 'a'.repeat(59) + ' x';
      const result = deriveProjectName(text);
      expect(result).toBe('a'.repeat(59));
    });

    it('leaves short idea unchanged', () => {
      expect(deriveProjectName('Short')).toBe('Short');
    });
  });

  describe('newProjectSchema', () => {
    it('rejects 9 characters', () => {
      const result = newProjectSchema.safeParse({ idea: '123456789' });
      expect(result.success).toBe(false);
    });

    it('accepts 10 characters after trim', () => {
      const result = newProjectSchema.safeParse({ idea: '  1234567890  ' });
      expect(result.success).toBe(true);
    });

    it('accepts 8000 characters', () => {
      const result = newProjectSchema.safeParse({ idea: 'a'.repeat(8000) });
      expect(result.success).toBe(true);
    });

    it('rejects 8001 characters', () => {
      const result = newProjectSchema.safeParse({ idea: 'a'.repeat(8001) });
      expect(result.success).toBe(false);
    });
  });

  describe('renameProjectSchema', () => {
    it('rejects empty string', () => {
      const result = renameProjectSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('rejects whitespace only', () => {
      const result = renameProjectSchema.safeParse({ name: '   ' });
      expect(result.success).toBe(false);
    });

    it('accepts 100 characters', () => {
      const result = renameProjectSchema.safeParse({ name: 'a'.repeat(100) });
      expect(result.success).toBe(true);
    });

    it('rejects 101 characters', () => {
      const result = renameProjectSchema.safeParse({ name: 'a'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe('isDeleteConfirmed', () => {
    it('exact match returns true', () => {
      expect(isDeleteConfirmed('MyProject', 'MyProject')).toBe(true);
    });

    it('ignores surrounding spaces', () => {
      expect(isDeleteConfirmed('  MyProject  ', 'MyProject')).toBe(true);
    });

    it('case sensitive', () => {
      expect(isDeleteConfirmed('myproject', 'MyProject')).toBe(false);
    });

    it('false for empty name', () => {
      expect(isDeleteConfirmed('', '')).toBe(false);
    });

    it('false for partial text', () => {
      expect(isDeleteConfirmed('MyProj', 'MyProject')).toBe(false);
    });
  });
});
