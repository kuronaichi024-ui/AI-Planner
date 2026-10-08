import { notFound } from 'next/navigation';
import { projectIdSchema } from '@/lib/schemas/project';
import { requireUser } from '@/app/_lib/require-user';
import { getProject } from '@/server/db';
import { formatReadiness } from '@/lib/project';
import { RelativeTime } from '@/components/relative-time';
import { EmptyState } from '@/components/empty-state';

export default async function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const idResult = projectIdSchema.safeParse(id);
  if (!idResult.success) notFound();

  await requireUser();
  const project = await getProject(idResult.data);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="space-y-2">
        <h1 className="text-h1">{project.name}</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{formatReadiness(project.readinessScore, project.brainRevision)}</span>
          <span>&middot;</span>
          <span>
            Updated <RelativeTime date={project.updatedAt} />
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-h3">Original idea</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{project.ideaText}</p>
      </div>

      <EmptyState message="The Architect interview, requirements, and outputs will appear here in later phases. For now this workspace is a shell: rename or delete the project from the sidebar." />
    </div>
  );
}
