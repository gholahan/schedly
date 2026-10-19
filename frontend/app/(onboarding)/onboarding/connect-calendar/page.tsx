'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { useConnectGoogle } from '@/features/onboarding/api/onboarding.queries';

function ConnectCalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const connectGoogle = useConnectGoogle();
  const [isConnected, setIsConnected] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  // Check if user was redirected back after successful connection or error
  useEffect(() => {
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    setErrorCode(error);
    if (connected === 'true') {
      setIsConnected(true);
      setErrorMessage(null);
    } else if (error) {
      if (error === 'invalid_state') {
        setErrorMessage('OAuth session expired or invalid. Please try connecting again.');
      } else if (error === 'google_oauth_failed') {
        setErrorMessage(`Google OAuth failed: ${message || 'Unknown error'}`);
      } else if (error === 'token_exchange_failed') {
        setErrorMessage('Failed to exchange Google authorization code. Please try again.');
      } else if (error === 'not_authenticated') {
        setErrorMessage('You are not signed in or your session has expired. Please log in to connect your calendar.');
      } else {
        setErrorMessage(message || 'Failed to connect calendar. Please try again.');
      }
    }
  }, [searchParams]);

  const handleConnect = () => {
    connectGoogle.mutate();
  };

  const handleContinue = () => {
    router.push('/onboarding/preferences');
  };

  return (
    <div className="w-full max-w-[480px] text-center">
      {/* Google Calendar Icon */}
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 2v3m8-3v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
              stroke="var(--color-success)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h1 className="mb-3 text-[32px] font-semibold text-[var(--color-text-primary)]">
        Connect your calendar
      </h1>

      {/* Subtitle */}
      <p className="mb-6 text-base text-[var(--color-text-secondary)]">
        {isConnected
          ? 'Your Google Calendar is now connected. You can manage meetings and see your availability.'
          : 'Connect your Google Calendar so Schedly can check your availability and schedule meetings for you.'}
      </p>

      {errorMessage && (
        <div className="mb-6 rounded-lg bg-[var(--color-error-bg)] border border-[var(--color-error)] p-3 text-sm text-[var(--color-error)] text-left flex items-start gap-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="shrink-0 mt-0.5">
            <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2" />
            <path d="M10 6v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}

      {!isConnected ? (
        <>
          {/* Benefits List */}
          <div className="mb-8 space-y-3 text-left">
            <div className="flex items-center gap-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="flex-shrink-0"
              >
                <circle cx="10" cy="10" r="9" stroke="var(--color-success)" strokeWidth="2" />
                <path
                  d="M6 10l2.5 2.5L14 7"
                  stroke="var(--color-success)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-[var(--color-text-primary)]">
                View your schedule and free time slots
              </p>
            </div>
            <div className="flex items-center gap-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="flex-shrink-0"
              >
                <circle cx="10" cy="10" r="9" stroke="var(--color-success)" strokeWidth="2" />
                <path
                  d="M6 10l2.5 2.5L14 7"
                  stroke="var(--color-success)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-[var(--color-text-primary)]">
                Automatically find the best meeting times
              </p>
            </div>
            <div className="flex items-center gap-3">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="flex-shrink-0"
              >
                <circle cx="10" cy="10" r="9" stroke="var(--color-success)" strokeWidth="2" />
                <path
                  d="M6 10l2.5 2.5L14 7"
                  stroke="var(--color-success)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-[var(--color-text-primary)]">
                Add new meetings directly to your calendar
              </p>
            </div>
          </div>

          {/* Connect Button */}
          {errorCode === 'not_authenticated' ? (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={() => router.push('/login')}
            >
              Log In to Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              className="w-full"
              onClick={handleConnect}
              isLoading={connectGoogle.isPending}
              disabled={connectGoogle.isPending}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                className="mr-2"
              >
                <path
                  d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
                  fill="#4285F4"
                />
                <path
                  d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
                  fill="#34A853"
                />
                <path
                  d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"
                  fill="#FBBC05"
                />
                <path
                  d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
                  fill="#EA4335"
                />
              </svg>
              Connect with Google calender
            </Button>
          )}

          {/* Privacy note */}
          <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
            We only request calendar access. Your data is encrypted and never shared.
          </p>
        </>
      ) : (
        <>
          {/* Success indicator */}
          <div className="mb-8 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-success-bg)]">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path
                  d="M8 16l6 6L24 10"
                  stroke="var(--color-success)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Continue Button */}
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </>
      )}

      {/* Progress indicator */}
      <div className="mt-6 flex justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
        <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
        <div className="h-2 w-2 rounded-full bg-[var(--color-border-strong)]" />
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
        Step 2 of 3
      </p>
    </div>
  );
}

export default function ConnectCalendarPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-[480px] text-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--color-text-primary)] border-t-transparent rounded-full mx-auto" />
      </div>
    }>
      <ConnectCalendarContent />
    </Suspense>
  );
}
