import { AppHeader } from '@/components/app-header';
import { requireUser } from '@/app/_lib/require-user';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <div className="flex flex-col h-screen">
      <AppHeader user={user} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
