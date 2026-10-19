'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useUserStore } from './user.store';
import { useLogin, useSignup, useLogout, useMe } from './api/auth.queries';

export function useAuth() {
  const user = useUserStore((state) => state.user);
  const pathname = usePathname();

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup');
  const isOnboardingPage = pathname?.startsWith('/onboarding');

  const loginMutation = useLogin();
  const signupMutation = useSignup();
  const logoutMutation = useLogout();

  // Disable useMe during active login/signup mutations to prevent race condition
  // Also disable on auth pages (login/signup) and during onboarding to avoid disruption
  const isMutating = loginMutation.isPending || signupMutation.isPending;
  const { data: fetchedUser, isLoading } = useMe(!isAuthPage && !isOnboardingPage && !isMutating && pathname !== null);

  return {
    user: user || fetchedUser || null,
    isLoading,
    isAuthenticated: !!user || !!fetchedUser,

    login: loginMutation.mutate,
    signup: signupMutation.mutate,
    logout: logoutMutation.mutate,

    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,

    loginError: loginMutation.error,
    signupError: signupMutation.error,
    logoutError: logoutMutation.error,
  };
}

export function useRequireAuth() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  return { isLoading, isAuthenticated };
}

/**
 * Guard: user must be authenticated AND have Google Calendar connected.
 * If not authenticated → /login
 * If authenticated but no calendar → /onboarding/connect-calendar
 */
export function useRequireCalendar() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check user.has_google_calendar directly from /me response
    if (user && !user.has_google_calendar) {
      router.push('/onboarding/connect-calendar');
    }
  }, [isAuthenticated, isLoading, user, router]);

  return {
    isLoading,
    isAuthenticated,
    isCalendarConnected: user?.has_google_calendar ?? false,
  };
}

export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const isAuthenticated = !!user;

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/c/new');
    }
  }, [isAuthenticated, router]);

  return { isLoading: false };
}
