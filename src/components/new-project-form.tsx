'use client';
import { useActionState, useState } from 'react';
import { createProjectAction } from '@/app/projects/actions';
import { initialActionState, type ActionState } from '@/lib/form';
import { IDEA_MAX_LENGTH, IDEA_MIN_LENGTH } from '@/lib/schemas/project';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FieldError, FormMessage } from '@/components/form-feedback';

type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export function NewProjectForm() {
  const [state, formAction, pending] = useActionState(
    createProjectAction as unknown as FormAction,
    initialActionState
  );
  const [charLength, setCharLength] = useState(0);

  const ideaError = state.fieldErrors?.idea;
  const isTooShort = charLength < IDEA_MIN_LENGTH;

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.message && <FormMessage status={state.status} message={state.message} />}
      <div className="space-y-2">
        <Label htmlFor="idea">What do you want to build?</Label>
        <Textarea
          id="idea"
          name="idea"
          defaultValue={state.values?.idea ?? ''}
          placeholder="Describe your product idea..."
          rows={8}
          onChange={(e) => setCharLength(e.target.value.trim().length)}
          aria-invalid={ideaError ? true : undefined}
          aria-describedby={ideaError ? 'idea-error' : undefined}
        />
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          {ideaError ? <FieldError id="idea-error" message={ideaError} /> : <span />}
          <span>
            {charLength} / {IDEA_MAX_LENGTH.toLocaleString('en-US')}
          </span>
        </div>
      </div>
      <Button type="submit" disabled={pending || isTooShort} className="w-full">
        {pending ? 'Starting...' : 'Start Planning'}
      </Button>
    </form>
  );
}
