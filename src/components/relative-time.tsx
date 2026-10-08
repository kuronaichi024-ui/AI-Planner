'use client';
import { useSyncExternalStore } from 'react';
import { formatRelativeTime } from '@/lib/time';

export function RelativeTime({ date }: { date: string | Date }) {
  const text = useSyncExternalStore(
    (onChange) => {
      const timer = setInterval(onChange, 60_000);
      return () => clearInterval(timer);
    },
    () => formatRelativeTime(date, new Date()),
    () => ''
  );

  return <span>{text}</span>;
}
