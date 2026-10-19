'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useAuth } from '@/features/auth/use-auth.hook';

export default function OnboardingWelcomePage() {
  const router = useRouter();
  const { user } = useAuth();

  const handleGetStarted = () => {
    router.push('/onboarding/connect-calendar');
  };

  return (
    <div className="w-full max-w-[480px] text-center">
      {/* Schedly Logo/Icon */}
      <div className="mb-6 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#10a37f]">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 2v3m8-3v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Welcome Title */}
      <h1 className="mb-3 text-[32px] font-semibold text-[var(--color-text-primary)]">
        Welcome to Schedly{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
      </h1>

      {/* Subtitle */}
      <p className="mb-8 text-base text-[var(--color-text-secondary)]">
        Let's get your account set up so you can start scheduling smarter. This will only take a minute.
      </p>

      {/* Features List */}
      <div className="mb-10 space-y-4 text-left">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l2.5 2.5L10 3"
                stroke="var(--color-text-inverse)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-[var(--color-text-primary)]">
              Connect your calendar
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Sync with Google Calendar to see your availability
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l2.5 2.5L10 3"
                stroke="var(--color-text-inverse)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-[var(--color-text-primary)]">
              Set your preferences
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Configure working hours and scheduling preferences
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-success)]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6l2.5 2.5L10 3"
                stroke="var(--color-text-inverse)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-[var(--color-text-primary)]">
              Start scheduling
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Let AI handle your scheduling automatically
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleGetStarted}
      >
        Get started
      </Button>

      {/* Progress indicator */}
      <div className="mt-6 flex justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
        <div className="h-2 w-2 rounded-full bg-[var(--color-border-strong)]" />
        <div className="h-2 w-2 rounded-full bg-[var(--color-border-strong)]" />
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
        Step 1 of 3
      </p>
    </div>
  );
}
