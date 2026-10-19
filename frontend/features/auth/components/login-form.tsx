'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useAuth } from '../use-auth.hook';
import { loginSchema, type LoginFormData } from '../auth.schemas';
import { Button, Input, PasswordInput } from '@/components/ui';

// Map backend error messages to user-friendly messages
function getLoginErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Login failed. Please try again.';
  if (error.message.includes('401') || error.message.toLowerCase().includes('invalid')) {
    return 'Invalid email or password.';
  }
  if (error.message.includes('Network') || error.message.includes('network')) {
    return 'Network error. Please check your connection.';
  }
  return error.message || 'Login failed. Please try again.';
}

export function LoginForm() {
  const { login, isLoggingIn, loginError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
      {loginError && (
        <div className="rounded-lg bg-[var(--color-error-bg)] px-4 py-3 border border-[var(--color-error)]">
          <p className="text-sm text-[var(--color-error)]">
            {getLoginErrorMessage(loginError)}
          </p>
        </div>
      )}

      <div>
        <Input
          id="email"
          type="email"
          placeholder="Email address"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
      </div>

      <div>
        <PasswordInput
          id="password"
          placeholder="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={isLoggingIn}
        disabled={isLoggingIn}
      >
        Continue
      </Button>

      <div className="text-center pt-2">
        <span className="text-sm text-[var(--color-text-tertiary)]">
          Don't have an account?{' '}
        </span>
        <Link
          href="/signup"
          className="text-sm font-medium text-[var(--color-success)] hover:opacity-80 transition-colors"
        >
          Sign up
        </Link>
      </div>
    </form>
  );
}
