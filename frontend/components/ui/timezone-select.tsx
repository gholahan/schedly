'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TimezoneSelectProps {
  value: string;
  onChange: (timezone: string) => void;
  className?: string;
  error?: string;
  placeholder?: string;
}

const FALLBACK_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Zurich',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
];

export function TimezoneSelect({
  value,
  onChange,
  className,
  error,
  placeholder = 'Search timezone (e.g. New York, UTC)...',
}: TimezoneSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);

  // Get all supported timezones or fallback
  const allTimezones = useMemo(() => {
    try {
      if (typeof Intl !== 'undefined' && typeof Intl.supportedValuesOf === 'function') {
        const zones = Intl.supportedValuesOf('timeZone');
        return Array.from(new Set([...FALLBACK_TIMEZONES, ...zones]));
      }
    } catch {
      // ignore
    }
    return FALLBACK_TIMEZONES;
  }, []);

  // Filter timezones based on query
  const filteredTimezones = useMemo(() => {
    if (!query.trim()) return allTimezones;
    const q = query.toLowerCase();
    return allTimezones.filter((tz) => tz.toLowerCase().includes(q));
  }, [allTimezones, query]);

  // Sync query when value prop changes externally
  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (tz: string) => {
    onChange(tz);
    setQuery(tz);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleClear = () => {
    setQuery('');
    onChange('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-lg border bg-[var(--color-background)] px-3 py-2 pr-16 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] transition-all focus:outline-none focus:ring-2 focus:ring-[var(--color-success)]',
            error ? 'border-[var(--color-error)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          )}
        />
        <div className="absolute right-3 flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-[var(--color-text-primary)] transition-colors p-0.5"
              title="Clear timezone"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="pointer-events-none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-[var(--color-error)]">{error}</p>}

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg py-1">
          {filteredTimezones.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[var(--color-text-tertiary)] text-center">
              No timezones found (custom value allowed)
            </div>
          ) : (
            filteredTimezones.map((tz) => {
              const isSelected = tz === value;
              return (
                <button
                  key={tz}
                  type="button"
                  onClick={() => handleSelect(tz)}
                  className={cn(
                    'w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between',
                    isSelected
                      ? 'bg-[var(--color-success)] text-[var(--color-text-inverse)] font-medium'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
                  )}
                >
                  <span>{tz}</span>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M11.6667 3.5L5.25 9.91667L2.33333 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
