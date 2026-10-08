import { describe, it, expect } from 'vitest';
import {
  parseProjectCounts,
  formatReadiness,
  type ProjectCounts,
} from '@/lib/project';

describe('project', () => {
  describe('parseProjectCounts', () => {
    it('fills missing keys with 0', () => {
      const result = parseProjectCounts({ requirements: 5 });
      expect(result.requirements).toBe(5);
      expect(result.features).toBe(0);
      expect(result.tasks).toBe(0);
    });

    it('negatives become 0', () => {
      const result = parseProjectCounts({ requirements: -1 });
      expect(result.requirements).toBe(0);
    });

    it('floats become 0', () => {
      const result = parseProjectCounts({ requirements: 1.5 });
      expect(result.requirements).toBe(0);
    });

    it('numeric strings become 0', () => {
      const result = parseProjectCounts({ requirements: '5' });
      expect(result.requirements).toBe(0);
    });

    it('garbage object becomes all zeros', () => {
      const result = parseProjectCounts({ foo: 'bar', baz: null });
      expect(result).toEqual({
        requirements: 0,
        features: 0,
        roles: 0,
        screens: 0,
        entities: 0,
        rules: 0,
        decisions: 0,
        tasks: 0,
      });
    });

    it('null/undefined becomes all zeros', () => {
      expect(parseProjectCounts(null)).toEqual({
        requirements: 0,
        features: 0,
        roles: 0,
        screens: 0,
        entities: 0,
        rules: 0,
        decisions: 0,
        tasks: 0,
      });
      expect(parseProjectCounts(undefined)).toEqual({
        requirements: 0,
        features: 0,
        roles: 0,
        screens: 0,
        entities: 0,
        rules: 0,
        decisions: 0,
        tasks: 0,
      });
    });

    it('valid input passes through', () => {
      const input: ProjectCounts = {
        requirements: 1,
        features: 2,
        roles: 3,
        screens: 4,
        entities: 5,
        rules: 6,
        decisions: 7,
        tasks: 8,
      };
      expect(parseProjectCounts(input)).toEqual(input);
    });
  });

  describe('formatReadiness', () => {
    it('placeholder for revision 0', () => {
      expect(formatReadiness(0, 0)).toBe('\u2014');
      expect(formatReadiness(42, 0)).toBe('\u2014');
      expect(formatReadiness(100, 0)).toBe('\u2014');
    });

    it('percentage for revision > 0', () => {
      expect(formatReadiness(0, 1)).toBe('0%');
      expect(formatReadiness(42, 1)).toBe('42%');
      expect(formatReadiness(100, 5)).toBe('100%');
    });
  });
});