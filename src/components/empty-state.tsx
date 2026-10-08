import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function EmptyState({
  message,
  actionLabel,
  actionHref,
}: {
  message: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg border-dashed">
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>
      {actionLabel && actionHref && (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
