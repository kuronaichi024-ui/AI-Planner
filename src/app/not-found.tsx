import Link from 'next/link';
import { APP_NAME } from '@/config/app';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
      <p className="text-small font-medium text-muted-foreground">404</p>
      <h1 className="text-h1">Page not found</h1>
      <p className="text-base-ui text-muted-foreground">
        The page you requested does not exist in {APP_NAME}.
      </p>
      <Link href="/" className="text-sm font-medium text-link underline-offset-4 hover:underline">
        ← Go home
      </Link>
    </main>
  );
}
