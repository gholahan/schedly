import { apiClient } from '@/lib/axios';
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
  RefreshResponse,
  LogoutResponse,
} from '../types';
import type { User } from '../types';

/**
 * Login with email and password
 * Sets httpOnly refresh_token cookie on success
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/login', data);
  return response.data;
};

/**
 * Sign up a new user
 * Sets httpOnly refresh_token cookie on success
 */
export const signup = async (data: SignupRequest): Promise<SignupResponse> => {
  const response = await apiClient.post<SignupResponse>('/auth/signup', data);
  return response.data;
};

/**
 * Logout current user
 * Clears httpOnly refresh_token cookie
 */
export const logout = async (): Promise<LogoutResponse> => {
  const response = await apiClient.post<LogoutResponse>('/auth/logout');
  return response.data;
};

/**
 * Refresh access token using httpOnly refresh_token cookie
 */
export const refreshToken = async (): Promise<RefreshResponse> => {
  const response = await apiClient.post<RefreshResponse>('/auth/refresh');
  return response.data;
};

/**
 * Get current authenticated user
 */
export const getMe = async (): Promise<User> => {
  const response = await apiClient.get<User>('/auth/me');
  return response.data;
};
