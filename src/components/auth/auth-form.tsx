'use client';
import { useActionState } from 'react';
import { signInAction, signUpAction } from '@/app/(auth)/actions';
import { initialActionState, type ActionState } from '@/lib/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FieldError, FormMessage } from '@/components/form-feedback';

type FormAction = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export function AuthForm({ mode }: { mode: 'signin' | 'signup' }) {
  const action: FormAction = mode === 'signin' ? signInAction : signUpAction;
  const [state, formAction, pending] = useActionState(action, initialActionState);

  const emailError = state.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;
  const submitLabel =
    mode === 'signin'
      ? pending
        ? 'Signing in...'
        : 'Sign in'
      : pending
        ? 'Creating account...'
        : 'Create account';

  return (
    <form action={formAction} noValidate className="space-y-4">
      {state.message && <FormMessage status={state.status} message={state.message} />}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email ?? ''}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? 'email-error' : undefined}
        />
        {emailError && <FieldError id="email-error" message={emailError} />}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? 'password-error' : undefined}
        />
        {passwordError && <FieldError id="password-error" message={passwordError} />}
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
