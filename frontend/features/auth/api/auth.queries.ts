import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as authApi from './auth.api';
import type { LoginRequest, SignupRequest } from '../types';
import { useUserStore } from '../user.store';
import { queryKeys } from '@/lib/query-keys';


export function useMe(enabled = true) {
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      try {
        const user = await authApi.getMe();
        setUser(user);
        return user;
      } catch (error) {
        clearUser();
        throw error;
      }
    },
    enabled,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}


export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);

  return useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (response) => {
      // Set user directly from login response - no extra /me call needed
      setUser(response.user);

      // Invalidate auth queries to ensure everything is fresh
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });

      // Redirect to conversation page
      router.push('/c/new');
    },
  });
}

/**
 * Mutation: Signup
 */
export function useSignup() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);

  return useMutation({
    mutationFn: (data: SignupRequest) => authApi.signup(data),
    onSuccess: async (response) => {
      // Set user from signup response
      setUser(response?.user);

      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.all });

      // Redirect to onboarding
      router.push('/onboarding');
    },
  });
}

/**
 * Mutation: Logout
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearUser = useUserStore((state) => state.clearUser);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // Clear user from store
      clearUser();

      // Clear all queries
      queryClient.clear();

      // Redirect to login
      router.push('/login');
    },
  });
}
