import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { ActionStatus } from '@/lib/form';

export function FormMessage({
  status,
  message,
}: {
  status: ActionStatus;
  message: string;
}) {
  if (status === 'idle' || !message) return null;
  const isError = status === 'error';
  const role = isError ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`flex items-start gap-2 rounded-md border p-3 text-sm text-foreground ${
        isError ? 'border-destructive/50 bg-destructive/10' : 'border-success/50 bg-success/10'
      }`}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
      )}
      <p>{message}</p>
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  );
}
