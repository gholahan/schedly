import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth, useRedirectIfAuthenticated } from '@/features/auth/use-auth.hook';
import { useUserStore } from '@/features/auth/user.store';
import { makeUser } from '../mocks/factories';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
}));

import { useState } from 'react';

function createWrapper() {
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
      () =>
        new QueryClient({
          defaultOptions: { queries: { retry: false } },
        })
    );
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useAuth hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUserStore.getState().clearUser();
  });

  it('useAuth returns authentication status based on store and fetched user', () => {
    const mockUser = makeUser();
    useUserStore.getState().setUser(mockUser);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('useRedirectIfAuthenticated redirects to /c/new when user is present', async () => {
    useUserStore.getState().setUser(makeUser());

    renderHook(() => useRedirectIfAuthenticated());

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/c/new');
    });
  });
});
