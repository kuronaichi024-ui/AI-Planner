import { z } from 'zod';

export const IDEA_MIN_LENGTH = 10;
export const IDEA_MAX_LENGTH = 8000;
/** Matches the CHECK constraint on projects.name. */
export const PROJECT_NAME_MAX_LENGTH = 100;
/** A new project is named after the first 60 characters of its idea (spec section Phase 1, task 6). */
export const DERIVED_NAME_MAX_LENGTH = 60;

export const projectIdSchema = z.uuid();

export const newProjectSchema = z.object({
  idea: z
    .string()
    .trim()
    .min(IDEA_MIN_LENGTH, `Describe your idea in at least ${IDEA_MIN_LENGTH} characters.`)
    .max(IDEA_MAX_LENGTH, `Keep your idea under ${IDEA_MAX_LENGTH.toLocaleString('en-US')} characters.`),
});

export const renameProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a project name.')
    .max(PROJECT_NAME_MAX_LENGTH, `Use at most ${PROJECT_NAME_MAX_LENGTH} characters.`),
});

export type NewProjectInput = z.infer<typeof newProjectSchema>;
export type RenameProjectInput = z.infer<typeof renameProjectSchema>;

/**
 * Project name for a new project: the first 60 characters of the idea, with
 * whitespace collapsed and trimmed. Counts code points, so it never splits an emoji.
 */
export function deriveProjectName(idea: string): string {
  const collapsed = idea.replace(/\s+/g, ' ').trim();
  return Array.from(collapsed).slice(0, DERIVED_NAME_MAX_LENGTH).join('').trim();
}

/** The delete confirmation matches when the typed text equals the project name (surrounding spaces ignored). */
export function isDeleteConfirmed(typed: string, projectName: string): boolean {
  const name = projectName.trim();
  return name.length > 0 && typed.trim() === name;
}
