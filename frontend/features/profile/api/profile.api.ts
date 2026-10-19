import { apiClient } from '@/lib/axios';
import type {
  ProfileResponse,
  ProfileUpdateRequest,
  ChangePasswordRequest,
  DeleteAccountRequest,
} from '../types/profile.types';

/**
 * Get current user's profile
 */
export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await apiClient.get<ProfileResponse>('/users/me');
  return response.data;
};

/**
 * Update current user's profile (name, email, avatar_url)
 */
export const updateProfile = async (
  data: ProfileUpdateRequest
): Promise<ProfileResponse> => {
  const response = await apiClient.patch<ProfileResponse>('/users/me', data);
  return response.data;
};

/**
 * Change current user's password
 */
export const changePassword = async (
  data: ChangePasswordRequest
): Promise<void> => {
  await apiClient.post('/users/me/change-password', data);
};

/**
 * Delete current user's account
 */
export const deleteAccount = async (
  data: DeleteAccountRequest
): Promise<void> => {
  await apiClient.delete('/users/me', { data });
};
