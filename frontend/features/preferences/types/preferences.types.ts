// Preferences feature types

export interface Preferences {
  timezone: string;
  locale: string;
  working_days: string[];
  working_hours_start: string; // time format from backend
  working_hours_end: string;
  default_meeting_duration_minutes: number;
  buffer_minutes: number;
  minimum_notice_minutes: number;
  scheduling_horizon_days: number;
  selected_calendar_ids: string[];
}

export interface PreferencesUpdateRequest {
  timezone?: string;
  locale?: string;
  working_days?: string[];
  working_hours_start?: string;
  working_hours_end?: string;
  default_meeting_duration_minutes?: number;
  buffer_minutes?: number;
  minimum_notice_minutes?: number;
  scheduling_horizon_days?: number;
  selected_calendar_ids?: string[];
}
