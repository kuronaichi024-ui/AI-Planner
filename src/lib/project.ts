import { z } from 'zod';

const count = z.number().int().nonnegative().catch(0);

/** projects.counts holds counts of confirmed items (spec section 5). Missing or invalid values read as 0. */
export const projectCountsSchema = z.object({
  requirements: count,
  features: count,
  roles: count,
  screens: count,
  entities: count,
  rules: count,
  decisions: count,
  tasks: count,
});

export type ProjectCounts = z.infer<typeof projectCountsSchema>;

export const EMPTY_COUNTS: ProjectCounts = {
  requirements: 0,
  features: 0,
  roles: 0,
  screens: 0,
  entities: 0,
  rules: 0,
  decisions: 0,
  tasks: 0,
};

export function parseProjectCounts(value: unknown): ProjectCounts {
  const parsed = projectCountsSchema.safeParse(value);
  return parsed.success ? parsed.data : EMPTY_COUNTS;
}

export type ProjectSummary = {
  id: string;
  name: string;
  readinessScore: number;
  brainRevision: number;
  counts: ProjectCounts;
  updatedAt: string;
};

export type Project = ProjectSummary & {
  ideaText: string;
  language: string;
  createdAt: string;
};

/** Shown instead of a percentage until the Brain has been committed at least once. */
export const READINESS_PLACEHOLDER = '\u2014';

/**
 * The cached readiness score as text. Until the first Brain commit there is
 * nothing to score, so the score reads as an em dash rather than a misleading 0%.
 */
export function formatReadiness(score: number, brainRevision: number): string {
  return brainRevision > 0 ? `${score}%` : READINESS_PLACEHOLDER;
}
