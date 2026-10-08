import Link from 'next/link';
import { APP_NAME } from '@/config/app';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { signOutAction } from '@/app/(auth)/actions';
import { PROJECTS_PATH } from '@/lib/auth-routes';
import type { SessionUser } from '@/lib/session';

export function AppHeader({ user }: { user: SessionUser | null }) {

  return (
    <header className="flex h-14 items-center justify-between border-b px-6">
      <div className="flex items-center gap-6">
        <Link href={PROJECTS_PATH} className="text-lg font-semibold">
          {APP_NAME}
        </Link>
      </div>
      <div className="flex items-center gap-4">
        {user?.email && (
          <span className="hidden text-sm text-muted-foreground lg:inline-block">
            {user.email}
          </span>
        )}
        <ThemeToggle />
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" className="min-h-[40px]">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
