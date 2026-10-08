export type NavGroup = 'project' | 'output';

export type WorkspaceSection = {
  /** URL segment under /projects/[id]. The empty slug is the Overview. */
  slug: string;
  label: string;
  group: NavGroup;
};

/** Left navigation of the workspace (spec section 9.2). */
export const WORKSPACE_SECTIONS: readonly WorkspaceSection[] = [
  { slug: '', label: 'Overview', group: 'project' },
  { slug: 'requirements', label: 'Requirements', group: 'project' },
  { slug: 'features', label: 'Features', group: 'project' },
  { slug: 'roles', label: 'Roles', group: 'project' },
  { slug: 'screens', label: 'Screens', group: 'project' },
  { slug: 'data-model', label: 'Data model', group: 'project' },
  { slug: 'rules', label: 'Business rules', group: 'project' },
  { slug: 'decisions', label: 'Decisions', group: 'project' },
  { slug: 'prd', label: 'PRD', group: 'output' },
  { slug: 'build-plan', label: 'Build plan', group: 'output' },
  { slug: 'agent-prompt', label: 'AI coding prompt', group: 'output' },
];

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  project: 'PROJECT',
  output: 'OUTPUT',
};

export function workspaceHref(projectId: string, slug: string): string {
  return slug === '' ? `/projects/${projectId}` : `/projects/${projectId}/${slug}`;
}

/** Looks up a non-overview section by URL segment. */
export function findSection(slug: string): WorkspaceSection | null {
  if (slug === '') return null;
  return WORKSPACE_SECTIONS.find(section => section.slug === slug) ?? null;
}

/**
 * Maps a section slug to the key in ProjectCounts it shows a badge for, or null.
 * The Overview and output sections have no count.
 */
export function countKeyForSlug(slug: string): keyof {
  requirements: number;
  features: number;
  roles: number;
  screens: number;
  entities: number;
  rules: number;
  decisions: number;
  tasks: number;
} | null {
  switch (slug) {
    case 'requirements':
      return 'requirements';
    case 'features':
      return 'features';
    case 'roles':
      return 'roles';
    case 'screens':
      return 'screens';
    case 'data-model':
      return 'entities';
    case 'rules':
      return 'rules';
    case 'decisions':
      return 'decisions';
    case 'build-plan':
      return 'tasks';
    default:
      return null;
  }
}
