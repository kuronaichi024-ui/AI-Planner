import Link from 'next/link';
import { APP_NAME } from '@/config/app';
import { ThemeToggle } from '@/components/theme-toggle';
import { PROJECTS_PATH } from '@/lib/auth-routes';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <Link href={PROJECTS_PATH} className="text-lg font-semibold">
          {APP_NAME}
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
