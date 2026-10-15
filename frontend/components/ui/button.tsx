// Button component matching ChatGPT design exactly from Figma

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles - ChatGPT exact design
          'inline-flex items-center justify-center font-medium rounded-md transition-all duration-200',
          'focus:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',

          // Variants - ChatGPT colors
          variant === 'primary' && [
            'bg-[#10a37f] text-white shadow-sm',
            'hover:bg-[#1a7f64]',
            'active:scale-[0.98]',
            'disabled:hover:bg-[#10a37f]',
          ],
          variant === 'secondary' && [
            'bg-white text-[#2d333a] border border-[#c2c8cc]',
            'hover:bg-[#f7f7f8]',
            'dark:bg-[#3e3f4b] dark:text-[#ececf1] dark:border-[#565869]',
            'dark:hover:bg-[#4a4b5a]',
          ],
          variant === 'ghost' && [
            'text-[#6e6e80] hover:bg-[#f7f7f8]',
            'dark:text-[#8e8ea0] dark:hover:bg-[#2a2b32]',
          ],
          variant === 'danger' && [
            'bg-[#ef4146] text-white',
            'hover:bg-[#d93c41]',
            'active:scale-[0.98]',
          ],

          // Sizes - ChatGPT dimensions
          size === 'sm' && 'h-9 px-3 text-sm',
          size === 'md' && 'h-11 px-4 text-base',
          size === 'lg' && 'h-[52px] px-6 text-base',

          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
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
  }
);

Button.displayName = 'Button';
