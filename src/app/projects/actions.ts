'use server';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { logActionError } from '@/app/_lib/log';
import { requireUser } from '@/app/_lib/require-user';
import { PROJECTS_PATH } from '@/lib/auth-routes';
import { firstIssuePerField, formString, type ActionState } from '@/lib/form';
import {
  deriveProjectName,
  isDeleteConfirmed,
  newProjectSchema,
  projectIdSchema,
  renameProjectSchema,
} from '@/lib/schemas/project';
import { createProject, deleteProject, getProject, renameProject } from '@/server/db';

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

export async function renameProjectAction(
  projectId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const idResult = projectIdSchema.safeParse(projectId);
  if (!idResult.success) notFound();

  const name = formString(formData, 'name');
  const parsed = renameProjectSchema.safeParse({ name });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: firstIssuePerField(parsed.error), values: { name } };
  }

  try {
    await requireUser();
    const ok = await renameProject(idResult.data, parsed.data.name);
    if (!ok) {
      return { status: 'error', message: 'This project no longer exists.' };
    }
  } catch (e) {
    logActionError('rename_project', e);
    return { status: 'error', message: 'Something went wrong. Try again.', values: { name } };
  }

  revalidatePath(PROJECTS_PATH);
  revalidatePath(`/projects/${idResult.data}`, 'layout');
  return { status: 'success', values: { name } };
}

export async function deleteProjectAction(
  projectId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const idResult = projectIdSchema.safeParse(projectId);
  if (!idResult.success) notFound();

  const confirm = formString(formData, 'confirm');
  const confirmError = 'Type the project name exactly.';

  try {
    await requireUser();
    const project = await getProject(idResult.data);
    if (!project) {
      return { status: 'error', message: 'This project no longer exists.' };
    }
    if (!isDeleteConfirmed(confirm, project.name)) {
      return { status: 'error', fieldErrors: { confirm: confirmError } };
    }
    await deleteProject(idResult.data);
  } catch (e) {
    logActionError('delete_project', e);
    return { status: 'error', message: 'Something went wrong. Try again.' };
  }

  revalidatePath(PROJECTS_PATH);
  redirect(PROJECTS_PATH);
}
