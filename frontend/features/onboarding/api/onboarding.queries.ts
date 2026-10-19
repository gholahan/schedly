import { useMutation, useQuery } from '@tanstack/react-query';
import { checkGoogleConnection, initiateGoogleOAuth } from './onboarding.api';

export const onboardingKeys = {
  all: ['onboarding'] as const,
  googleConnection: () => [...onboardingKeys.all, 'google-connection'] as const,
};

/**
 * Check if user has connected Google Calendar
 */
export function useGoogleConnectionStatus(enabled = true) {
  return useQuery({
    queryKey: onboardingKeys.googleConnection(),
    queryFn: checkGoogleConnection,
    staleTime: 30000, // 30 seconds
    enabled,
  });
}

/**
 * Initiate Google Calendar OAuth connection
 * Redirects to backend which then redirects to Google OAuth
 */
export function useConnectGoogle() {
  return useMutation({
    mutationFn: async () => {
      initiateGoogleOAuth();
      // User will be redirected, no return value
    },
  });
}
