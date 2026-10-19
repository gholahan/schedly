// Input component matching ChatGPT design exactly from Figma

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          type={type}
          className={cn(
            // Base styles - ChatGPT exact design using globals.css variables
            'w-full rounded-md px-4 text-base',
            'h-[52px]',
            'bg-[var(--color-background)]',
            'text-[var(--color-text-primary)]',
            'border border-[var(--color-border-strong)]',
            'placeholder:text-[var(--color-text-tertiary)]',
            'transition-all duration-150 ease-in-out',

            // Focus state - ChatGPT green accent
            'focus:outline-none focus:border-[var(--color-success)] focus:shadow-[0_0_0_1px_var(--color-success)]',

            // Hover state
            'hover:border-[var(--color-text-tertiary)]',

            // Error state - red border and glow
            error && [
              'border-[var(--color-error)] focus:border-[var(--color-error)] focus:shadow-[0_0_0_1px_var(--color-error)]',
            ],

            // Disabled state
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--color-surface)]',

            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-[var(--color-error)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
