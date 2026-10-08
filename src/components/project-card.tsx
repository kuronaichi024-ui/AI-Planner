import Link from 'next/link';
import { formatReadiness, type ProjectSummary } from '@/lib/project';
import { RelativeTime } from '@/components/relative-time';

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const reqCount = project.counts.requirements;
  const featCount = project.counts.features;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="flex flex-col justify-between rounded-lg border p-5 transition-colors hover:border-foreground/50 hover:bg-muted/50"
    >
      <div className="space-y-3">
        <h2 className="text-base font-semibold truncate">{project.name}</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{formatReadiness(project.readinessScore, project.brainRevision)}</span>
          <span>&middot;</span>
          <span>build-ready</span>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex gap-2">
          <span>
            {reqCount} {reqCount === 1 ? 'requirement' : 'requirements'}
          </span>
          <span>&middot;</span>
          <span>
            {featCount} {featCount === 1 ? 'feature' : 'features'}
          </span>
        </div>
        <div>
          Updated <RelativeTime date={project.updatedAt} />
        </div>
      </div>
    </Link>
  );
}
