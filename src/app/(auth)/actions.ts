'use server';
import { redirect } from 'next/navigation';
import { logActionError } from '@/app/_lib/log';
import { LOGIN_PATH, PROJECTS_PATH } from '@/lib/auth-routes';
import { firstIssuePerField, formString, type ActionState } from '@/lib/form';
import { signInSchema, signUpSchema } from '@/lib/schemas/auth';
import { DbError, signInWithPassword, signOut, signUpWithPassword } from '@/server/db';

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = formString(formData, 'email');
  const password = formString(formData, 'password');

  const parsed = signInSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: firstIssuePerField(parsed.error), values: { email } };
  }

  try {
    const result = await signInWithPassword(parsed.data.email, parsed.data.password);
    if (!result.ok) {
      return { status: 'error', message: result.message, values: { email } };
    }
  } catch (e) {
    logActionError('sign_in', e);
    return { status: 'error', message: 'Something went wrong. Try again.', values: { email } };
  }

  redirect(PROJECTS_PATH);
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = formString(formData, 'email');
  const password = formString(formData, 'password');

  const parsed = signUpSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: firstIssuePerField(parsed.error), values: { email } };
  }

  try {
    const result = await signUpWithPassword(parsed.data.email, parsed.data.password);
    if (!result.ok) {
      return { status: 'error', message: result.message, values: { email } };
    }
    if (!result.signedIn) {
      return {
        status: 'success',
        message: 'Account created. Check your email to confirm it, then sign in.',
        values: { email },
      };
    }
  } catch (e) {
    logActionError('sign_up', e);
    return { status: 'error', message: 'Something went wrong. Try again.', values: { email } };
  }

  redirect(PROJECTS_PATH);
}

export async function signOutAction(): Promise<void> {
  try {
    await signOut();
  } catch (e) {
    logActionError('sign_out', e);
  }
  redirect(LOGIN_PATH);
}
