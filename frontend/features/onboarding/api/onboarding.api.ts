import { apiClient } from '@/lib/axios';

/**
 * Check if user has connected Google Calendar
 * Returns connection status by checking if GoogleConnection exists for user
 */
export async function checkGoogleConnection(): Promise<{ connected: boolean }> {
  const response = await apiClient.get<{ connected: boolean }>(
    '/calendar/google/status'
  );
  return response.data;
}

/**
 * Initiate Google Calendar OAuth flow
 * Backend redirects directly, so we build the full URL and navigate
 */
export function initiateGoogleOAuth(): void {
  // Backend /calendar/google/connect returns a RedirectResponse
  // We navigate directly and let the browser follow the redirect chain
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const connectUrl = `${apiUrl}/calendar/google/connect`;
  window.location.href = connectUrl;
}
