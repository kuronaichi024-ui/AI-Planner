import Link from 'next/link';
import { AuthForm } from '@/components/auth/auth-form';
import { SIGNUP_PATH } from '@/lib/auth-routes';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-h2">Sign in</h1>
      </div>
      <AuthForm mode="signin" />
      <p className="text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href={SIGNUP_PATH} className="font-medium text-link underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
