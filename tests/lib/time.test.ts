import { describe, it, expect } from 'vitest';
import { greetingForHour, formatRelativeTime } from '@/lib/time';

describe('time', () => {
  describe('greetingForHour', () => {
    it('returns Good evening for 0..4', () => {
      expect(greetingForHour(0)).toBe('Good evening');
      expect(greetingForHour(4)).toBe('Good evening');
    });

    it('returns Good morning for 5..11', () => {
      expect(greetingForHour(5)).toBe('Good morning');
      expect(greetingForHour(11)).toBe('Good morning');
    });

    it('returns Good afternoon for 12..17', () => {
      expect(greetingForHour(12)).toBe('Good afternoon');
      expect(greetingForHour(17)).toBe('Good afternoon');
    });

    it('returns Good evening for 18..23', () => {
      expect(greetingForHour(18)).toBe('Good evening');
      expect(greetingForHour(23)).toBe('Good evening');
    });

    it('returns Welcome back for invalid hours', () => {
      expect(greetingForHour(24)).toBe('Welcome back');
      expect(greetingForHour(-1)).toBe('Welcome back');
      expect(greetingForHour(1.5)).toBe('Welcome back');
      expect(greetingForHour(NaN)).toBe('Welcome back');
    });
  });

  describe('formatRelativeTime', () => {
    const now = new Date('2026-01-01T12:00:00Z');

    it('handles seconds correctly', () => {
      expect(formatRelativeTime(new Date('2026-01-01T11:59:50Z'), now)).toBe('just now');
      expect(formatRelativeTime(new Date('2026-01-01T11:59:16Z'), now)).toBe('just now');
      expect(formatRelativeTime(new Date('2026-01-01T11:59:15Z'), now)).toBe('1 minute ago');
    });

    it('handles minutes correctly', () => {
      // 1 minute ago
      expect(formatRelativeTime(new Date('2026-01-01T11:59:00Z'), now)).toBe('1 minute ago');
      // 3599s ago => 59 minutes ago
      expect(formatRelativeTime(new Date('2026-01-01T11:00:01Z'), now)).toBe('59 minutes ago');
    });

    it('handles hours correctly', () => {
      // 1 hour ago
      expect(formatRelativeTime(new Date('2026-01-01T11:00:00Z'), now)).toBe('1 hour ago');
      // 86399s ago => 23 hours ago
      expect(formatRelativeTime(new Date('2025-12-31T12:00:01Z'), now)).toBe('23 hours ago');
    });

    it('handles days, months, years', () => {
      expect(formatRelativeTime(new Date('2025-12-31T12:00:00Z'), now)).toBe('yesterday');
      expect(formatRelativeTime(new Date('2025-12-03T12:00:00Z'), now)).toBe('29 days ago');
      expect(formatRelativeTime(new Date('2025-11-01T12:00:00Z'), now)).toBe('2 months ago');
      expect(formatRelativeTime(new Date('2024-01-01T12:00:00Z'), now)).toBe('2 years ago');
    });

    it('handles future and invalid dates', () => {
      expect(formatRelativeTime(new Date('2026-01-01T12:05:00Z'), now)).toBe('just now');
      expect(formatRelativeTime('invalid-date', now)).toBe('');
    });
  });
});
