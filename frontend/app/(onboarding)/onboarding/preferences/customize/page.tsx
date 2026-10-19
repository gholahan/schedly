'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import { useGetPreferences, useUpdatePreferences } from '@/features/preferences/api/preferences.queries';
import { useTheme } from '@/features/theme/theme.provider';

const DAYS_OF_WEEK = [
  { label: 'Monday', value: 'Monday' },
  { label: 'Tuesday', value: 'Tuesday' },
  { label: 'Wednesday', value: 'Wednesday' },
  { label: 'Thursday', value: 'Thursday' },
  { label: 'Friday', value: 'Friday' },
  { label: 'Saturday', value: 'Saturday' },
  { label: 'Sunday', value: 'Sunday' },
];

export default function CustomizePreferencesPage() {
  const router = useRouter();
  const { data: preferences, isLoading } = useGetPreferences();
  const updatePreferences = useUpdatePreferences();
  const { theme, setTheme } = useTheme();

  const [workingStart, setWorkingStart] = useState('09:00');
  const [workingEnd, setWorkingEnd] = useState('17:00');
  const [timezone, setTimezone] = useState('UTC');
  const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [duration, setDuration] = useState(30);
  const [buffer, setBuffer] = useState(15);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preferences) {
      if (preferences.working_hours_start) setWorkingStart(preferences.working_hours_start);
      if (preferences.working_hours_end) setWorkingEnd(preferences.working_hours_end);
      if (preferences.timezone) setTimezone(preferences.timezone);
      if (preferences.working_days) setWorkingDays(preferences.working_days);
      if (preferences.default_meeting_duration_minutes) setDuration(preferences.default_meeting_duration_minutes);
      if (preferences.buffer_minutes !== undefined) setBuffer(preferences.buffer_minutes);
    }
  }, [preferences]);

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      if (workingDays.length > 1) {
        setWorkingDays(workingDays.filter((d) => d !== day));
      }
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSaveAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await updatePreferences.mutateAsync({
        working_hours_start: workingStart,
        working_hours_end: workingEnd,
        timezone,
        working_days: workingDays,
        default_meeting_duration_minutes: duration,
        buffer_minutes: buffer,
      });
      router.push('/c/new');
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      setError(err?.response?.data?.detail || 'Failed to save preferences. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[480px] text-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--color-success)] border-t-transparent rounded-full mx-auto" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px] text-left">
      {/* Back button */}
      <button
        onClick={() => router.push('/onboarding/preferences')}
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </button>

      {/* Header */}
      <h1 className="mb-2 text-[28px] font-semibold text-[var(--color-text-primary)] text-center">
        Customize Preferences
      </h1>
      <p className="mb-8 text-sm text-[var(--color-text-secondary)] text-center">
        Fine-tune your working hours, timezone, and meeting durations.
      </p>

      {error && (
        <div className="mb-6 rounded-lg bg-[var(--color-error-bg)] border border-[var(--color-error)] p-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <form onSubmit={handleSaveAndContinue} className="space-y-6">
        {/* Working Hours */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Working Hours</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Start Time</label>
              <input
                type="time"
                value={workingStart}
                onChange={(e) => setWorkingStart(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">End Time</label>
              <input
                type="time"
                value={workingEnd}
                onChange={(e) => setWorkingEnd(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
              />
            </div>
          </div>
        </div>

        {/* Working Days */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Working Days</h3>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => {
              const isSelected = workingDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    isSelected
                      ? 'bg-[var(--color-success)] text-[var(--color-text-inverse)] border-[var(--color-success)]'
                      : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  {day.label.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timezone & Meeting Defaults */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Scheduling Defaults</h3>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Timezone</label>
            <input
              type="text"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. UTC, America/New_York"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Default Duration (min)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Buffer Time (min)</label>
              <select
                value={buffer}
                onChange={(e) => setBuffer(Number(e.target.value))}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
              >
                <option value={0}>0 min</option>
                <option value={5}>5 min</option>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appearance / Theme */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Appearance</h3>
          <p className="text-xs text-[var(--color-text-secondary)]">Choose how Schedly looks to you.</p>
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'system'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setTheme(mode)}
                className={`px-4 py-2.5 rounded-lg text-xs font-medium capitalize transition-colors border ${
                  theme === mode
                    ? 'bg-[var(--color-success)] text-[var(--color-text-inverse)] border-[var(--color-success)]'
                    : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          isLoading={updatePreferences.isPending}
        >
          Save & Continue to chat
        </Button>
      </form>

      {/* Progress indicator */}
      <div className="mt-6 flex justify-center gap-2">
        <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
        <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
        <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
      </div>
      <p className="mt-2 text-xs text-[var(--color-text-tertiary)] text-center">
        Step 3 of 3
      </p>
    </div>
  );
}
