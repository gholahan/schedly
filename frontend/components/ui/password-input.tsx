// Password input component with show/hide toggle

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, error, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="w-full">
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={cn(
              // Base styles - ChatGPT exact design using globals.css variables
              'w-full rounded-md px-4 pr-12 text-base',
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

          {/* Show/Hide Toggle Button */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              // Eye slash icon (hide)
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M10.584 10.587C10.2087 10.962 9.99775 11.4708 9.99756 12.0018C9.99737 12.5327 10.208 13.0417 10.583 13.417C10.958 13.7923 11.4668 14.0033 11.9978 14.0035C12.5287 14.0037 13.0377 13.793 13.413 13.418" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M9.363 5.365C10.2204 5.11972 11.1082 4.99684 12 5C16 5 19.333 7.333 22 12C21.222 13.361 20.388 14.524 19.497 15.488M17.357 17.349C15.726 18.449 13.942 19 12 19C8 19 4.667 16.667 2 12C3.369 9.605 4.913 7.825 6.632 6.659" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              // Eye icon (show)
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2 12C2 12 5 5 12 5C19 5 22 12 22 12C22 12 19 19 12 19C5 19 2 12 2 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-sm text-[var(--color-error)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = 'PasswordInput';
