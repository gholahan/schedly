'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface TimeSelectProps {
  value: string;
  onChange: (time: string) => void;
  className?: string;
  error?: string;
  placeholder?: string;
}

export function TimeSelect({
  value,
  onChange,
  className,
  error,
  placeholder = 'Select time (e.g. 09:00)',
}: TimeSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate 30-minute time slots (00:00 to 23:30)
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const hourStr = h.toString().padStart(2, '0');
        const minStr = m.toString().padStart(2, '0');
        slots.push(`${hourStr}:${minStr}`);
      }
    }
    return slots;
  }, []);

  // Format time for 12-hour display helper (e.g., "09:00" -> "9:00 AM")
  const format12Hour = (timeStr: string) => {
    try {
      const [hStr, mStr] = timeStr.split(':');
      if (!hStr || !mStr) return timeStr;
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (isNaN(h) || isNaN(m)) return timeStr;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  // Filter time slots based on query
  const filteredSlots = useMemo(() => {
    if (!query.trim()) return timeSlots;
    const q = query.toLowerCase();
    return timeSlots.filter((slot) => {
      const slot12 = format12Hour(slot).toLowerCase();
      return slot.includes(q) || slot12.includes(q);
    });
  }, [timeSlots, query]);

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

  const handleSelect = (slot: string) => {
    onChange(slot);
    setQuery(slot);
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
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-text-secondary)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-xl border bg-[var(--color-background)] pl-10 pr-16 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] transition-all focus:outline-none focus:border-[var(--color-success)] focus:shadow-[0_0_0_1px_var(--color-success)]',
            error ? 'border-[var(--color-error)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
          )}
        />
        <div className="absolute right-3 flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-[var(--color-text-primary)] transition-colors p-0.5"
              title="Clear time"
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
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg py-1">
          {filteredSlots.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[var(--color-text-tertiary)] text-center">
              No matching time slots (custom value allowed)
            </div>
          ) : (
            filteredSlots.map((slot) => {
              const isSelected = slot === value || slot === query;
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => handleSelect(slot)}
                  className={cn(
                    'w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between',
                    isSelected
                      ? 'bg-[var(--color-success)] text-[var(--color-text-inverse)] font-medium'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--color-background)]'
                  )}
                >
                  <span>{slot}</span>
                  <span className={cn('text-[11px]', isSelected ? 'opacity-90' : 'text-[var(--color-text-tertiary)]')}>
                    {format12Hour(slot)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
