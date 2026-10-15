// Textarea component matching ChatGPT style

import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          className={cn(
            // Base styles
            'w-full rounded-md px-4 py-3 text-sm',
            'bg-[var(--color-background)] text-[var(--color-text-primary)]',
            'border border-[var(--color-border)]',
            'placeholder:text-[var(--color-text-tertiary)]',
            'transition-colors resize-none',

            // Focus state
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',

            // Error state
            error && 'border-[var(--color-error)] focus:ring-[var(--color-error)]',

            // Disabled state
            'disabled:opacity-50 disabled:cursor-not-allowed',

            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[var(--color-error)]">{error}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
