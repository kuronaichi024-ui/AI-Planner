import 'server-only';
import { cache } from 'react';
import { parseProjectCounts, type Project, type ProjectSummary } from '@/lib/project';
import { createSupabaseServerClient } from './client';
import { DbError } from './errors';
import type { Tables } from './types';

// Every query here uses the user-scoped client, so RLS decides what is visible.
// A project that is not yours simply does not exist: callers treat null/false as 404.

type SummaryRow = Pick<
  Tables<'projects'>,
  'id' | 'name' | 'readiness_score' | 'brain_revision' | 'counts' | 'updated_at'
>;
type DetailRow = SummaryRow & Pick<Tables<'projects'>, 'idea_text' | 'language' | 'created_at'>;

function toSummary(row: SummaryRow): ProjectSummary {
  return {
    id: row.id,
    name: row.name,
    readinessScore: row.readiness_score,
    brainRevision: row.brain_revision,
    counts: parseProjectCounts(row.counts),
    updatedAt: row.updated_at,
  };
}

function toProject(row: DetailRow): Project {
  return {
    ...toSummary(row),
    ideaText: row.idea_text,
    language: row.language,
    createdAt: row.created_at,
  };
}

/** The signed-in user's projects, most recently updated first. */
export async function listProjects(): Promise<ProjectSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, readiness_score, brain_revision, counts, updated_at')
    .order('updated_at', { ascending: false });
  if (error) throw new DbError('list_projects', error.code);
  return data.map(toSummary);
}

/** One project, or null when it does not exist or is not yours. Deduplicated within one request. */
export const getProject = cache(async (id: string): Promise<Project | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, readiness_score, brain_revision, counts, updated_at, idea_text, language, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new DbError('get_project', error.code);
  return data ? toProject(data) : null;
});

export async function createProject(input: {
  ownerId: string;
  name: string;
  ideaText: string;
}): Promise<{ id: string }> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('projects')
    .insert({ owner_id: input.ownerId, name: input.name, idea_text: input.ideaText })
    .select('id')
    .single();
  if (error) throw new DbError('create_project', error.code);
  return { id: data.id };
}

/** Returns false when no project matched (missing, or not yours). */
export async function renameProject(id: string, name: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('projects').update({ name }).eq('id', id).select('id');
  if (error) throw new DbError('rename_project', error.code);
  return data.length > 0;
}

/** Deletes the project; dependent rows go with it through foreign-key cascades. */
export async function deleteProject(id: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('projects').delete().eq('id', id).select('id');
  if (error) throw new DbError('delete_project', error.code);
  return data.length > 0;
}
