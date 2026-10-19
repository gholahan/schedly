import { apiClient } from '@/lib/axios';
import { Preferences, PreferencesUpdateRequest } from '../types/preferences.types';

/**
 * Get user preferences (creates defaults if none exist)
 */
export async function getPreferences(): Promise<Preferences> {
  const response = await apiClient.get<Preferences>('/preferences');
  return response.data;
}

/**
 * Update user preferences
 */
export async function updatePreferences(
  updates: PreferencesUpdateRequest
): Promise<Preferences> {
  const response = await apiClient.patch<Preferences>('/preferences', updates);
  return response.data;
}

/**
 * Reset preferences to defaults
 */
export async function resetPreferences(): Promise<Preferences> {
  const response = await apiClient.post<Preferences>('/preferences/reset');
  return response.data;
}
