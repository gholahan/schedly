import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Onboarding | Schedly',
  description: 'Set up your Schedly account',
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  );
}
