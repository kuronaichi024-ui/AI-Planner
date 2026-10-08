import { notFound } from 'next/navigation';
import { projectIdSchema } from '@/lib/schemas/project';
import { findSection } from '@/lib/workspace-nav';
import { requireUser } from '@/app/_lib/require-user';
import { getProject } from '@/server/db';
import { EmptyState } from '@/components/empty-state';

export default async function ProjectSectionPage({
  params,
}: {
  params: Promise<{ id: string; section: string }>;
}) {
  const { id, section } = await params;
  const idResult = projectIdSchema.safeParse(id);
  if (!idResult.success) notFound();

  const found = findSection(section);
  if (!found) notFound();

  await requireUser();
  const project = await getProject(idResult.data);
  if (!project) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-h1">{found.label}</h1>
      <EmptyState
        message={`${found.label} for "${project.name}" will be built in later phases. This placeholder confirms the workspace navigation works.`}
      />
    </div>
  );
}
