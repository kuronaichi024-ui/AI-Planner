import Link from 'next/link';
import { listProjects } from '@/server/db';
import { requireUser } from '@/app/_lib/require-user';
import { Button } from '@/components/ui/button';
import { GreetingHeading } from '@/components/greeting-heading';
import { ProjectCard } from '@/components/project-card';
import { EmptyState } from '@/components/empty-state';

export default async function DashboardPage() {
  await requireUser();
  const projects = await listProjects();

  return (
    <div className="container max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <GreetingHeading />
        <Button asChild>
          <Link href="/projects/new">+ New project</Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          message="You have no projects yet. Describe what you want to build to get started."
          actionLabel="+ New project"
          actionHref="/projects/new"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
