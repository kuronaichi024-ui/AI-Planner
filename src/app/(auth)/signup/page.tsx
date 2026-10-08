import Link from 'next/link';
import { AuthForm } from '@/components/auth/auth-form';
import { LOGIN_PATH } from '@/lib/auth-routes';

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-h2">Create your account</h1>
      </div>
      <AuthForm mode="signup" />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href={LOGIN_PATH} className="font-medium text-link underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
