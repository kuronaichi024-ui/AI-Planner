import { notFound } from 'next/navigation';
import { projectIdSchema } from '@/lib/schemas/project';
import { requireUser } from '@/app/_lib/require-user';
import { getProject } from '@/server/db';
import { WorkspaceShell } from '@/components/workspace/workspace-shell';
import { WorkspaceHeader } from '@/components/workspace/workspace-header';

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idResult = projectIdSchema.safeParse(id);
  if (!idResult.success) notFound();

  await requireUser();
  const project = await getProject(idResult.data);
  if (!project) notFound();

  return (
    <div className="flex h-screen flex-col lg:h-dvh">
      <WorkspaceHeader
        projectId={project.id}
        projectName={project.name}
        counts={project.counts}
        readinessScore={project.readinessScore}
        brainRevision={project.brainRevision}
      />
      <div className="flex-1 overflow-hidden">
        <WorkspaceShell projectId={project.id} counts={project.counts}>
          {children}
        </WorkspaceShell>
      </div>
    </div>
  );
}
