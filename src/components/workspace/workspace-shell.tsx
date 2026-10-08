'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { WorkspaceNav } from '@/components/workspace/workspace-nav';
import { ArchitectPanel } from '@/components/workspace/architect-panel';
import type { ProjectCounts } from '@/lib/project';

export function WorkspaceShell({
  projectId,
  counts,
  children,
}: {
  projectId: string;
  counts: ProjectCounts;
  children: React.ReactNode;
}) {
  const [architectOpen, setArchitectOpen] = useState(false);

  return (
    <>
      {/* Desktop: grid with nav + content + architect column. */}
      <div
        className="hidden h-full grid-cols-[232px_minmax(0,1fr)] lg:grid xl:grid-cols-[232px_minmax(0,1fr)_380px]"
      >
        <aside className="flex h-full flex-col border-r bg-muted/20">
          <WorkspaceNav projectId={projectId} counts={counts} />
        </aside>
        <main className="overflow-y-auto">{children}</main>
        <aside className="hidden h-full overflow-y-auto border-l bg-muted/20 xl:block">
          <ArchitectPanel />
        </aside>
      </div>

      {/* Below xl: two-column variant without architect column. */}
      <div className="hidden h-full grid-cols-[232px_minmax(0,1fr)] lg:grid xl:hidden">
        <aside className="flex h-full flex-col border-r bg-muted/20">
          <WorkspaceNav projectId={projectId} counts={counts} />
        </aside>
        <main className="overflow-y-auto">{children}</main>
      </div>

      {/* Mobile: single column. */}
      <main className="h-full overflow-y-auto lg:hidden">{children}</main>

      <Sheet open={architectOpen} onOpenChange={setArchitectOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetTitle className="sr-only">Architect</SheetTitle>
          <ArchitectPanel />
        </SheetContent>
      </Sheet>

      <Button
        size="icon"
        className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg xl:hidden"
        aria-label="Open Architect"
        onClick={() => setArchitectOpen(true)}
      >
        <Sparkles className="h-5 w-5" />
      </Button>
    </>
  );
}
