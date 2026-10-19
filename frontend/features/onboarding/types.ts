// Onboarding feature types

export interface OnboardingStep {
  step: number;
  title: string;
  path: string;
  isOptional: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    step: 1,
    title: 'Welcome to Schedly',
    path: '/onboarding',
    isOptional: false,
  },
  {
    step: 2,
    title: 'Connect Calendar',
    path: '/onboarding/connect-calendar',
    isOptional: false,
  },
  {
    step: 3,
    title: 'Set Preferences',
    path: '/onboarding/preferences',
    isOptional: true,
  },
];

export interface GoogleConnectionStatus {
  isConnected: boolean;
}
