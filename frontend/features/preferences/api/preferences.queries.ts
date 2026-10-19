import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getPreferences, updatePreferences, resetPreferences } from './preferences.api';
import type { PreferencesUpdateRequest } from '../types/preferences.types';

export const preferencesKeys = {
  all: ['preferences'] as const,
  detail: () => [...preferencesKeys.all, 'detail'] as const,
};

/**
 * Get user preferences (creates defaults if none exist)
 */
export function useGetPreferences() {
  return useQuery({
    queryKey: preferencesKeys.detail(),
    queryFn: getPreferences,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Update user preferences
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: PreferencesUpdateRequest) => updatePreferences(updates),
    onSuccess: (data) => {
      queryClient.setQueryData(preferencesKeys.detail(), data);
      queryClient.invalidateQueries({ queryKey: preferencesKeys.all });
    },
  });
}

/**
 * Reset preferences to defaults
 */
export function useResetPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resetPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(preferencesKeys.detail(), data);
      queryClient.invalidateQueries({ queryKey: preferencesKeys.all });
    },
  });
}
