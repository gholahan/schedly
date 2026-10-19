'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '../use-auth.hook';
import { signupSchema, type SignupFormData } from '../auth.schemas';
import { Button, Input, PasswordInput, PasswordStrength } from '@/components/ui';

export function SignupForm() {
  const { signup, isSigningUp, signupError } = useAuth();
  const [password, setPassword] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = (data: SignupFormData) => {
    signup(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5">
      {signupError && (
        <div className="rounded-lg bg-[var(--color-error-bg)] px-4 py-3 border border-[var(--color-error)]">
          <p className="text-sm text-[var(--color-error)]">
            {signupError instanceof Error ? signupError.message : 'Signup failed. Please try again.'}
          </p>
        </div>
      )}

      <div>
        <Input
          id="name"
          type="text"
          placeholder="Name"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
      </div>

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
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password', {
            onChange: (e) => setPassword(e.target.value),
          })}
        />
        <PasswordStrength password={password} />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        isLoading={isSigningUp}
        disabled={isSigningUp}
      >
        Continue
      </Button>

      <div className="text-center pt-2">
        <span className="text-sm text-[#6e6e80] dark:text-[#8e8ea0]">
          Already have an account?{' '}
        </span>
        <Link
          href="/login"
          className="text-sm font-medium text-[#10a37f] hover:text-[#1a7f64] dark:text-[#10a37f] dark:hover:text-[#0d8968] transition-colors"
        >
          Log in
        </Link>
      </div>
    </form>
  );
}
