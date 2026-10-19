'use client';

import { ReactNode } from 'react';
import { useRequireCalendar } from '@/features/auth/use-auth.hook';

interface CalendarProtectedRouteProps {
  children: ReactNode;
}

export function CalendarProtectedRoute({ children }: CalendarProtectedRouteProps) {
  useRequireCalendar();

  // Render children immediately so the dashboard shell renders instantly without blocking on /me
  return <>{children}</>;
}
