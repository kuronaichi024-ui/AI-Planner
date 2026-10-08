'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { PROJECTS_PATH } from '@/lib/auth-routes';
import {
  NAV_GROUP_LABELS,
  WORKSPACE_SECTIONS,
  countKeyForSlug,
  workspaceHref,
  type NavGroup,
} from '@/lib/workspace-nav';
import type { ProjectCounts } from '@/lib/project';

export function WorkspaceNav({
  projectId,
  counts,
}: {
  projectId: string;
  counts: ProjectCounts;
}) {
  const pathname = usePathname();
  const groups: NavGroup[] = ['project', 'output'];

  return (
    <nav aria-label="Project sections" className="flex-1 overflow-y-auto p-4">
      {groups.map((group) => (
        <div key={group} className="mb-6 space-y-1 last:mb-0">
          <p className="px-2 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground">
            {NAV_GROUP_LABELS[group]}
          </p>
          {WORKSPACE_SECTIONS.filter((s) => s.group === group).map((section) => {
            const href = workspaceHref(projectId, section.slug);
            const isActive = pathname === href;
            const countKey = countKeyForSlug(section.slug);
            const count = countKey ? counts[countKey] : null;
            return (
              <Link
                key={section.slug}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors',
                  isActive
                    ? 'bg-accent font-medium text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                )}
              >
                <span>{section.label}</span>
                {count !== null && count > 0 && (
                  <span className="tabular-nums text-xs text-muted-foreground">{count}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
      <Link href={PROJECTS_PATH} className="block px-2 text-xs text-muted-foreground hover:text-foreground">
        ← All projects
      </Link>
    </nav>
  );
}
