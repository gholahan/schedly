'use client';

import { useRedirectIfAuthenticated } from '@/features/auth/use-auth.hook';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
  const { isLoading } = useRedirectIfAuthenticated();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-text-primary">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your account to continue"
    >
      <LoginForm />
    </AuthLayout>
  );
}

