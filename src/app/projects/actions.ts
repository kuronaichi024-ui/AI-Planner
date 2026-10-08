'use server';
import { redirect } from 'next/navigation';
import { logActionError } from '@/app/_lib/log';
import { deriveProjectName, newProjectSchema } from '@/lib/schemas/project';
import { firstIssuePerField, formString, type ActionState } from '@/lib/form';
import { DbError, createProject } from '@/server/db';
import { requireUser } from '@/app/_lib/require-user';
import { revalidatePath } from 'next/cache';
import { PROJECTS_PATH } from '@/lib/auth-routes';

export async function createProjectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const idea = formString(formData, 'idea');

  const parsed = newProjectSchema.safeParse({ idea });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: firstIssuePerField(parsed.error), values: { idea } };
  }

  let projectId: string | null = null;
  try {
    const user = await requireUser();
    const result = await createProject({
      ownerId: user.id,
      name: deriveProjectName(parsed.data.idea),
      ideaText: parsed.data.idea,
    });
    projectId = result.id;
  } catch (e) {
    logActionError('create_project', e);
    return { status: 'error', message: 'Something went wrong. Try again.', values: { idea } };
  }

  revalidatePath(PROJECTS_PATH);
  redirect(`/projects/${projectId}`);
}
