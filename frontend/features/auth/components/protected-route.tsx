'use client';

import { ReactNode } from 'react';
import { useRequireAuth } from '@/features/auth/use-auth.hook';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  useRequireAuth();

  // Render children immediately so the app layout renders instantly without blocking on /me
  return <>{children}</>;
}
