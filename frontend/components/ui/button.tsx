
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      type = 'button',
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center gap-2',
          'rounded-[var(--radius-control)] font-medium',
          'transition-colors duration-150',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          'focus-visible:outline-[var(--color-text-secondary)]',
          'disabled:cursor-not-allowed disabled:opacity-50',

          // Primary: black background, white text (in light mode), white background, black text (in dark mode)
          variant === 'primary' && [
            'bg-black text-white dark:bg-white dark:text-black',
            'border border-[var(--color-border-strong)]',
            'shadow-[var(--shadow-sm)]',
            'hover:bg-neutral-800 dark:hover:bg-neutral-100',
            'active:bg-neutral-700 dark:active:bg-neutral-200',
          ],

          // Secondary
          variant === 'secondary' && [
            'border border-[var(--color-border-strong)]',
            'bg-[var(--color-background)]',
            'text-[var(--color-text-primary)]',
            'hover:bg-[var(--color-surface)]',
            'active:bg-[var(--color-surface-active)]',
          ],

          // Ghost
          variant === 'ghost' && [
            'text-[var(--color-text-secondary)]',
            'hover:bg-[var(--color-surface)]',
            'hover:text-[var(--color-text-primary)]',
            'active:bg-[var(--color-surface-active)]',
          ],

          // Danger
          variant === 'danger' && [
            'bg-[var(--color-error)]',
            'text-white',
            'hover:opacity-90',
            'active:opacity-80',
          ],

          // Sizes
          size === 'sm' && 'h-9 px-3 text-[var(--text-xs)]',
          size === 'md' && 'h-10 px-4 text-[var(--text-sm)]',
          size === 'lg' && 'h-13 px-6 text-[var(--text-base)]',

          className,
        )}
        {...props}
      >
        {isLoading && (
          <svg
            aria-hidden="true"
            className="h-4 w-4 shrink-0 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}

        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
