'use client';
import { useSyncExternalStore } from 'react';
import { greetingForHour } from '@/lib/time';

const subscribeNever = () => () => {};

export function GreetingHeading() {
  const greeting = useSyncExternalStore(
    subscribeNever,
    () => greetingForHour(new Date().getHours()),
    () => 'Welcome back'
  );
  return <h1 className="text-h1">{greeting}</h1>;
}
