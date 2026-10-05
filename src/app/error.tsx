"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the server console only in development; never expose details.
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-h1">Something went wrong</h1>
      <p className="max-w-prose text-center text-base-ui text-muted-foreground">
        An unexpected error occurred. You can try again.
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </main>
  );
}