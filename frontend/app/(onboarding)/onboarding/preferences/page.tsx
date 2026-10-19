'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useGetPreferences } from '@/features/preferences/api/preferences.queries';

export default function OnboardingPreferencesPage() {
  const router = useRouter();
  const getPreferences = useGetPreferences();

  const handleSkip = async () => {
    // Call GET /preferences to register initial defaults
    try {
      await getPreferences.refetch();
      router.push('/c/new');
    } catch (error) {
      console.error('Failed to register default preferences:', error);
      // Still proceed to conversation page even if this fails
      router.push('/c/new');
    }
  };

  const handleSetPreferences = () => {
    router.push('/onboarding/preferences/customize');
  };

  return (
    <div className="w-full max-w-[480px] text-center">
      {/* Settings Icon */}
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)]">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
              stroke="var(--color-success)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
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
        Set your preferences
      </h1>

      {/* Subtitle */}
      <p className="mb-8 text-base text-[var(--color-text-secondary)]">
        Customize your working hours and scheduling preferences. You can always change these later in settings.
      </p>

      {/* Preferences Preview */}
      <div className="mb-8 space-y-4 text-left">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--color-text-primary)]">
                Working hours
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                9:00 AM - 5:00 PM
              </p>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M7.5 5l5 5-5 5"
                stroke="var(--color-text-tertiary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--color-text-primary)]">
                Working days
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Monday - Friday
              </p>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M7.5 5l5 5-5 5"
                stroke="var(--color-text-tertiary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[var(--color-text-primary)]">
                Time zone
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Detect automatically
              </p>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M7.5 5l5 5-5 5"
                stroke="var(--color-text-tertiary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={handleSetPreferences}
        >
          Customize preferences
        </Button>

        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={handleSkip}
          isLoading={getPreferences.isFetching}
          disabled={getPreferences.isFetching}
        >
          Skip for now
        </Button>
      </div>

      {/* Helper text */}
      <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
        Default preferences will be used until you customize them
      </p>

      {/* Progress indicator */}
      <div className="mt-6 flex justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
        <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
        <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
        Step 3 of 3
      </p>
    </div>
  );
}
