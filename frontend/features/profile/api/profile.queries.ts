import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as profileApi from './profile.api';
import type {
  ProfileUpdateRequest,
  ChangePasswordRequest,
  DeleteAccountRequest,
} from '../types';
import { queryKeys } from '@/lib/query-keys';
import { useUserStore } from '@/features/auth/user.store';

export function useProfile() {
  return useQuery({
    queryKey: queryKeys.users.profile,
    queryFn: () => profileApi.getProfile(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useUserStore((state) => state.setUser);

  return useMutation({
    mutationFn: (data: ProfileUpdateRequest) => profileApi.updateProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.profile });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      const currentUser = useUserStore.getState().user;
      if (currentUser) {
        setUser({
          ...currentUser,
          name: updatedProfile.name,
          email: updatedProfile.email,
          avatar_url: updatedProfile.avatar_url,
        });
      }
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordRequest) => profileApi.changePassword(data),
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  const clearUser = useUserStore((state) => state.clearUser);

  return useMutation({
    mutationFn: (data: DeleteAccountRequest) => profileApi.deleteAccount(data),
    onSuccess: () => {
      clearUser();
      queryClient.clear();
    },
  });
}
