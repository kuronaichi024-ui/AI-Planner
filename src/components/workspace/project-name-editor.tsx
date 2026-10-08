'use client';

import { useEffect, useActionState, useState, startTransition } from 'react';
import { renameProjectAction } from '@/app/projects/actions';
import { initialActionState, type ActionState } from '@/lib/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormMessage } from '@/components/form-feedback';

type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export function ProjectNameEditor({
  projectId,
  currentName,
}: {
  projectId: string;
  currentName: string;
}) {
  const [editing, setEditing] = useState(false);
  const actionWithId = renameProjectAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState(
    actionWithId as unknown as FormAction,
    initialActionState
  );

  useEffect(() => {
    if (state.status === 'success') {
      startTransition(() => setEditing(false));
    }
  }, [state.status]);

  const displayName = state.values?.name ?? currentName;

  if (!editing) {
    return (
      <div className="flex items-center gap-3">
        <h1 className="text-h2 truncate">{displayName}</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditing(true)}
          className="h-8"
        >
          Rename
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      {state.message && <FormMessage status={state.status} message={state.message} />}
      <div className="flex items-center gap-2">
        <Input
          name="name"
          defaultValue={displayName}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setEditing(false);
            }
          }}
          className="h-9"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? 'Saving...' : 'Save'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setEditing(false)}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
