import { format, formatDistanceToNow, isToday as dateFnsIsToday, parseISO } from 'date-fns';

export function formatDate(dateStr: string | Date, formatStr = 'PPP'): string {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return format(date, formatStr);
}

export function formatRelativeTime(dateStr: string | Date): string {
  if (!dateStr) return '';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return formatDistanceToNow(date, { addSuffix: true });
}

export function isToday(dateStr: string | Date): boolean {
  if (!dateStr) return false;
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  return dateFnsIsToday(date);
}
