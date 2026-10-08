// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { allocateKey } from '@/server/brain/keys';

describe('allocateKey', () => {
  it('pads first key to 3 digits', () => {
    const result = allocateKey({}, 'GOAL');
    expect(result.key).toBe('GOAL-001');
    expect(result.counters).toEqual({ GOAL: 1 });
  });

  it('increments existing counter', () => {
    const result = allocateKey({ GOAL: 5 }, 'GOAL');
    expect(result.key).toBe('GOAL-006');
    expect(result.counters).toEqual({ GOAL: 6 });
  });

  it('does not mutate counters', () => {
    const counters = { GOAL: 5 };
    const result = allocateKey(counters, 'GOAL');
    expect(counters).toEqual({ GOAL: 5 });
    expect(result.counters).toEqual({ GOAL: 6 });
  });

  it('grows past 999', () => {
    const result = allocateKey({ GOAL: 999 }, 'GOAL');
    expect(result.key).toBe('GOAL-1000');
    expect(result.counters).toEqual({ GOAL: 1000 });
  });

  it('keeps other prefixes untouched', () => {
    const result = allocateKey({ GOAL: 1, REQ: 2 }, 'FEAT');
    expect(result.key).toBe('FEAT-001');
    expect(result.counters).toEqual({ GOAL: 1, REQ: 2, FEAT: 1 });
  });

  it('never reuses a key', () => {
    const first = allocateKey({}, 'GOAL');
    const second = allocateKey(first.counters, 'GOAL');
    expect(first.key).not.toBe(second.key);
    expect(second.counters.GOAL).toBe(first.counters.GOAL! + 1);
  });
});
