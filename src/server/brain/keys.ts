import type { Brain } from './schemas';

export function allocateKey(
  counters: Brain['counters'],
  prefix: string
): { key: string; counters: Brain['counters'] } {
  const current = counters[prefix] || 0;
  const next = current + 1;
  const paddedNumber = String(next).padStart(3, '0');
  
  return {
    key: `${prefix}-${paddedNumber}`,
    counters: { ...counters, [prefix]: next },
  };
}
