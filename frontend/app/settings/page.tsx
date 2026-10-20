'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, TimezoneSelect, TimeSelect } from '@/components/ui';
import { useAuth, useRequireAuth } from '@/features/auth/use-auth.hook';
import { useGetPreferences, useUpdatePreferences, useResetPreferences } from '@/features/preferences/api/preferences.queries';
import { useTheme } from '@/features/theme/theme.provider';
import { useProfile, useUpdateProfile, useChangePassword, useDeleteAccount } from '@/features/profile/api/profile.queries';

const DAYS_OF_WEEK = [
  { label: 'Monday', value: 'Monday' },
  { label: 'Tuesday', value: 'Tuesday' },
  { label: 'Wednesday', value: 'Wednesday' },
  { label: 'Thursday', value: 'Thursday' },
  { label: 'Friday', value: 'Friday' },
  { label: 'Saturday', value: 'Saturday' },
  { label: 'Sunday', value: 'Sunday' },
];

export default function SettingsPage() {
  useRequireAuth();
  const router = useRouter();
  const { user, logout, isLoggingOut } = useAuth();
  const { data: preferences, isLoading: isLoadingPreferences } = useGetPreferences();
  const updatePreferences = useUpdatePreferences();
  const resetPreferences = useResetPreferences();
  const { theme, setTheme } = useTheme();

  // Profile queries & mutations
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const deleteAccount = useDeleteAccount();

  const [activeTab, setActiveTab] = useState<'scheduling' | 'appearance' | 'account'>('scheduling');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'account' || tab === 'appearance' || tab === 'scheduling') {
      setActiveTab(tab);
    }
  }, []);

  // Preferences form state
  const [workingStart, setWorkingStart] = useState('09:00');
  const [workingEnd, setWorkingEnd] = useState('17:00');
  const [timezone, setTimezone] = useState('UTC');
  const [workingDays, setWorkingDays] = useState<string[]>(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [duration, setDuration] = useState(30);
  const [buffer, setBuffer] = useState(15);
  const [minimumNotice, setMinimumNotice] = useState(60);
  const [schedulingHorizon, setSchedulingHorizon] = useState(30);

  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Delete account state
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (preferences) {
      if (preferences.working_hours_start) setWorkingStart(preferences.working_hours_start);
      if (preferences.working_hours_end) setWorkingEnd(preferences.working_hours_end);
      if (preferences.timezone) setTimezone(preferences.timezone);
      if (preferences.working_days) setWorkingDays(preferences.working_days);
      if (preferences.default_meeting_duration_minutes) setDuration(preferences.default_meeting_duration_minutes);
      if (preferences.buffer_minutes !== undefined) setBuffer(preferences.buffer_minutes);
      if (preferences.minimum_notice_minutes !== undefined) setMinimumNotice(preferences.minimum_notice_minutes);
      if (preferences.scheduling_horizon_days !== undefined) setSchedulingHorizon(preferences.scheduling_horizon_days);
    }
  }, [preferences]);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setEmail(profile.email || '');
    } else if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [profile, user]);

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      if (workingDays.length > 1) {
        setWorkingDays(workingDays.filter((d) => d !== day));
      }
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await updatePreferences.mutateAsync({
        working_hours_start: workingStart,
        working_hours_end: workingEnd,
        timezone,
        working_days: workingDays,
        default_meeting_duration_minutes: duration,
        buffer_minutes: buffer,
        minimum_notice_minutes: minimumNotice,
        scheduling_horizon_days: schedulingHorizon,
      });
      setSuccessMessage('Settings updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      setErrorMessage(err?.response?.data?.detail || 'Failed to update settings. Please try again.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    try {
      await updateProfile.mutateAsync({ name, email });
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setProfileError(err?.response?.data?.detail || 'Failed to update profile. Please try again.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    try {
      await changePassword.mutateAsync({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setPasswordError(err?.response?.data?.detail || 'Failed to change password. Please check your current password.');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    try {
      await deleteAccount.mutateAsync({ password: deletePassword });
      router.push('/login');
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      setDeleteError(err?.response?.data?.detail || 'Incorrect password. Failed to delete account.');
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all preferences to default values?')) return;
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await resetPreferences.mutateAsync();
      if (res) {
        setWorkingStart(res.working_hours_start || '09:00');
        setWorkingEnd(res.working_hours_end || '17:00');
        setTimezone(res.timezone || 'UTC');
        setWorkingDays(res.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
        setDuration(res.default_meeting_duration_minutes || 30);
        setBuffer(res.buffer_minutes || 15);
        setMinimumNotice(res.minimum_notice_minutes || 60);
        setSchedulingHorizon(res.scheduling_horizon_days || 30);
      }
      setSuccessMessage('Preferences reset to defaults.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error('Failed to reset preferences:', err);
      setErrorMessage('Failed to reset preferences. Please try again.');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--color-background)]">
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-12">
          <div className="sticky top-0 bg-[var(--color-background)]/95 backdrop-blur-md z-20 pt-6 pb-2 -mx-6 lg:-mx-10 px-6 lg:px-10 border-b border-[var(--color-border)]/40 mb-6 space-y-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/c/new')}
                  className="group flex items-center gap-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-active)] transition-all shadow-sm"
                  title="Return to chat"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5">
                    <path d="M19 12H5"></path>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                  <span>Back to chat</span>
                </button>
              </div>

              <div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">Settings</h1>
              </div>
            </div>

            <div className="max-w-3xl mx-auto flex border-b border-[var(--color-border)] gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('scheduling')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'scheduling'
                    ? 'border-[var(--color-success)] text-[var(--color-text-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Scheduling & Preferences
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'appearance'
                    ? 'border-[var(--color-success)] text-[var(--color-text-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Appearance
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('account')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'account'
                    ? 'border-[var(--color-success)] text-[var(--color-text-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Account & Integrations
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {activeTab === 'scheduling' && (
              <>
                {successMessage && (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                    <span>{successMessage}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs font-medium text-red-600 dark:text-red-400 flex items-center justify-between">
                    <span>{errorMessage}</span>
                  </div>
                )}

                {isLoadingPreferences ? (
                  <div className="py-20 text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-[var(--color-success)] border-t-transparent rounded-full mx-auto" />
                    <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">Loading settings...</p>
                  </div>
                ) : (
                  <form onSubmit={handleSavePreferences} className="space-y-6">
                    <div className="space-y-6 animate-in fade-in duration-200">
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-sm">
                        <div>
                          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Working Hours</h2>
                          <p className="text-xs text-[var(--color-text-secondary)]">Set your default daily working window for AI scheduling.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Start Time</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-secondary)]">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                              </div>
                              <input
                                type="time"
                                value={workingStart}
                                onChange={(e) => setWorkingStart(e.target.value)}
                                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-3.5 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-success)] focus:shadow-[0_0_0_1px_var(--color-success)] transition-all"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">End Time</label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-secondary)]">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                              </div>
                              <input
                                type="time"
                                value={workingEnd}
                                onChange={(e) => setWorkingEnd(e.target.value)}
                                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-3.5 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-success)] focus:shadow-[0_0_0_1px_var(--color-success)] transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-sm">
                        <div>
                          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Working Days</h2>
                          <p className="text-xs text-[var(--color-text-secondary)]">Select the days of the week you are available for meetings.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((day) => {
                            const isSelected = workingDays.includes(day.value);
                            return (
                              <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleDay(day.value)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors border ${
                                  isSelected
                                    ? 'bg-[var(--color-success)] text-[var(--color-text-inverse)] border-[var(--color-success)] shadow-sm'
                                    : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                                }`}
                              >
                                {day.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-sm">
                        <div>
                          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Timezone & Meeting Defaults</h2>
                          <p className="text-xs text-[var(--color-text-secondary)]">Configure your timezone and standard meeting parameters.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Timezone</label>
                          <TimezoneSelect value={timezone} onChange={setTimezone} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Default Meeting Duration (min)</label>
                            <select
                              value={duration}
                              onChange={(e) => setDuration(Number(e.target.value))}
                              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
                            >
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                              <option value={45}>45 minutes</option>
                              <option value={60}>60 minutes</option>
                              <option value={90}>90 minutes</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Buffer Time Between Meetings (min)</label>
                            <select
                              value={buffer}
                              onChange={(e) => setBuffer(Number(e.target.value))}
                              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
                            >
                              <option value={0}>0 minutes (no buffer)</option>
                              <option value={5}>5 minutes</option>
                              <option value={10}>10 minutes</option>
                              <option value={15}>15 minutes</option>
                              <option value={30}>30 minutes</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Minimum Notice (minutes)</label>
                            <input
                              type="number"
                              min={0}
                              step={15}
                              value={minimumNotice}
                              onChange={(e) => setMinimumNotice(Number(e.target.value))}
                              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Scheduling Horizon (days)</label>
                            <input
                              type="number"
                              min={1}
                              max={365}
                              value={schedulingHorizon}
                              onChange={(e) => setSchedulingHorizon(Number(e.target.value))}
                              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-[var(--color-border)]">
                      <button
                        type="button"
                        onClick={handleReset}
                        disabled={resetPreferences.isPending}
                        className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-error)] transition-colors"
                      >
                        Reset to defaults
                      </button>

                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => router.push('/c/new')}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          isLoading={updatePreferences.isPending}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-sm">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Interface Theme</h2>
                    <p className="text-xs text-[var(--color-text-secondary)]">Customize how Schedly looks on your device.</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {(['light', 'dark', 'system'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTheme(mode)}
                        className={`p-4 rounded-xl text-xs font-medium capitalize transition-all border flex flex-col items-center gap-2 ${
                          theme === mode
                            ? 'bg-[var(--color-success)] text-[var(--color-text-inverse)] border-[var(--color-success)] shadow-md'
                            : 'bg-[var(--color-background)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                        }`}
                      >
                        <span className="text-sm font-semibold">{mode}</span>
                        <span className="text-[10px] opacity-80">
                          {mode === 'light' && 'Clean light mode'}
                          {mode === 'dark' && 'Easy on the eyes'}
                          {mode === 'system' && 'Matches OS settings'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Profile Overview & Update Form */}
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-6 shadow-sm">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Account Profile</h2>
                    <p className="text-xs text-[var(--color-text-secondary)]">Update your personal details, name, and email address.</p>
                  </div>

                  {profileSuccess && (
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {profileSuccess}
                    </div>
                  )}

                  {profileError && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                      {profileError}
                    </div>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="flex items-center gap-4 py-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-active)] text-[var(--color-text-primary)] font-bold text-lg border border-[var(--color-border)]">
                        {name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{name || 'Schedly User'}</p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">{email || 'No email'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--color-success)]/10 text-[var(--color-success)] uppercase">
                            {profile?.plan || 'Free Plan'}
                          </span>
                          <span className="text-[10px] text-[var(--color-text-tertiary)]">
                            {profile?.credits ?? 0} Credits remaining
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Full Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-success)] focus:shadow-[0_0_0_1px_var(--color-success)] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Email Address</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-success)] focus:shadow-[0_0_0_1px_var(--color-success)] transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={updateProfile.isPending}
                      >
                        Save Profile
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Google Calendar Integration */}
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-sm">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Google Calendar Integration</h2>
                    <p className="text-xs text-[var(--color-text-secondary)]">Manage your connected calendar status for AI scheduling.</p>
                  </div>

                  <div className="flex items-center justify-between py-2 border-y border-[var(--color-border)]/50">
                    <div>
                      <p className="text-xs font-medium text-[var(--color-text-primary)]">Calendar Sync Status</p>
                      <p className="text-[11px] text-[var(--color-text-secondary)]">
                        {user?.has_google_calendar ? 'Connected and synced with Google Calendar' : 'Not connected'}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      user?.has_google_calendar
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user?.has_google_calendar ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {user?.has_google_calendar ? 'Connected' : 'Action Required'}
                    </span>
                  </div>

                  {!user?.has_google_calendar && (
                    <div className="pt-2">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => router.push('/onboarding/connect-calendar')}
                      >
                        Connect Google Calendar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Change Password Form */}
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-sm">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Change Password</h2>
                    <p className="text-xs text-[var(--color-text-secondary)]">Ensure your account is secure by using a strong password.</p>
                  </div>

                  {passwordSuccess && (
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {passwordSuccess}
                    </div>
                  )}

                  {passwordError && (
                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                      {passwordError}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Current Password</label>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-success)] focus:shadow-[0_0_0_1px_var(--color-success)] transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          minLength={8}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-success)] focus:shadow-[0_0_0_1px_var(--color-success)] transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          minLength={8}
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-success)] focus:shadow-[0_0_0_1px_var(--color-success)] transition-all"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        variant="secondary"
                        isLoading={changePassword.isPending}
                      >
                        Update Password
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Sign Out */}
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-sm">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Sign Out</h2>
                    <p className="text-xs text-[var(--color-text-secondary)]">End your current session on this device.</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => logout()}
                    isLoading={isLoggingOut}
                  >
                    Log out of Schedly
                  </Button>
                </div>

                {/* Danger Zone: Delete Account */}
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-4 shadow-sm">
                  <div>
                    <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>
                    <p className="text-xs text-[var(--color-text-secondary)]">Permanently delete your account and all associated data.</p>
                  </div>

                  {!showDeleteModal ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowDeleteModal(true)}
                      className="text-red-600 border-red-500/30 hover:bg-red-500/10"
                    >
                      Delete Account...
                    </Button>
                  ) : (
                    <form onSubmit={handleDeleteAccount} className="space-y-4 pt-2 border-t border-red-500/20">
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        Warning: This action is irreversible. Please enter your password to confirm account deletion.
                      </p>

                      {deleteError && (
                        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs font-medium text-red-600 dark:text-red-400">
                          {deleteError}
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Confirm Password</label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          required
                          placeholder="Enter your current password"
                          className="w-full rounded-xl border border-red-500/30 bg-[var(--color-background)] px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-red-500 focus:shadow-[0_0_0_1px_red] transition-all"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setShowDeleteModal(false);
                            setDeletePassword('');
                            setDeleteError(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          isLoading={deleteAccount.isPending}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          Permanently Delete Account
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
