import { describe, it, expect } from 'vitest';
import { formatDate, formatRelativeTime, isToday } from '@/lib/date-utils';

describe('date-utils', () => {
  it('formatDate formats date correctly', () => {
    const dateStr = '2026-10-26T12:00:00Z';
    const formatted = formatDate(dateStr, 'yyyy-MM-dd');
    expect(formatted).toBe('2026-10-26');
  });

  it('formatRelativeTime formats relative distance', () => {
    const nowStr = new Date().toISOString();
    const relative = formatRelativeTime(nowStr);
    expect(relative).toContain('ago');
  });

  it('isToday correctly identifies today', () => {
    const todayStr = new Date().toISOString();
    expect(isToday(todayStr)).toBe(true);

    const pastStr = '2020-01-01T00:00:00Z';
    expect(isToday(pastStr)).toBe(false);
  });
});
