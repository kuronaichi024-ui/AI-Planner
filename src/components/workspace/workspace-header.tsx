'use client';

import { useEffect, useState } from 'react';
import { Trash2, Menu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { formatReadiness } from '@/lib/project';
import type { ProjectCounts } from '@/lib/project';
import { WorkspaceNav } from '@/components/workspace/workspace-nav';
import { ProjectNameEditor } from '@/components/workspace/project-name-editor';
import { DeleteProjectDialog } from '@/components/workspace/delete-project-dialog';

export function WorkspaceHeader({
  projectId,
  projectName,
  counts,
  readinessScore,
  brainRevision,
}: {
  projectId: string;
  projectName: string;
  counts: ProjectCounts;
  readinessScore: number;
  brainRevision: number;
}) {
  const [navOpen, setNavOpen] = useState(false);

  // Close the mobile nav sheet when the route changes (pathname read by WorkspaceNav).
  useEffect(() => {
    const t = window.setTimeout(() => setNavOpen(false), 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <header className="flex items-center gap-3 border-b px-4 py-3 lg:px-6">
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Project navigation</SheetTitle>
          <WorkspaceNav projectId={projectId} counts={counts} />
        </SheetContent>
      </Sheet>

      <div className="min-w-0 flex-1">
        <ProjectNameEditor projectId={projectId} currentName={projectName} />
      </div>

      <div className="flex items-center gap-2">
        <Badge variant="secondary">Planning</Badge>
        <Badge variant="outline">
          {formatReadiness(readinessScore, brainRevision)}
          {' — '}build-ready
        </Badge>
        <DeleteProjectDialog projectId={projectId} projectName={projectName} />
      </div>
    </header>
  );
}
