import { requireUser } from '@/app/_lib/require-user';
import { NewProjectForm } from '@/components/new-project-form';

export default async function NewProjectPage() {
  await requireUser();

  return (
    <div className="container max-w-xl mx-auto p-6 py-12 space-y-6">
      <div className="space-y-2">
        <h1 className="text-h2">Start a new project</h1>
      </div>
      <NewProjectForm />
    </div>
  );
}
