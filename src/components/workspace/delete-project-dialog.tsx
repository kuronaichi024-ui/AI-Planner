'use client';

import { useActionState, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteProjectAction } from '@/app/projects/actions';
import { initialActionState, type ActionState } from '@/lib/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export function DeleteProjectDialog({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');

  const actionWithId = deleteProjectAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState(
    actionWithId as unknown as FormAction,
    initialActionState
  );

  const canDelete = typed.trim() === projectName;
  const confirmError = state.fieldErrors?.confirm;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) setTyped('');
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          aria-label="Delete project"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete project</DialogTitle>
          <DialogDescription>
            This permanently deletes the project and all of its data. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} noValidate className="space-y-4">
          {state.message && (
            <p role="alert" className="text-sm text-foreground">
              {state.message}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="confirm">
              Type the project name to confirm: <span className="font-mono font-bold">{projectName}</span>
            </Label>
            <Input
              id="confirm"
              name="confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={projectName}
              aria-invalid={confirmError ? true : undefined}
            />
            {confirmError && <p className="text-sm text-foreground">{confirmError}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={!canDelete || pending}>
              {pending ? 'Deleting...' : 'Delete project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
