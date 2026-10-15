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
            // Base styles - ChatGPT exact design
            'w-full rounded-md px-4 text-base',
            'h-[52px]', // Exact ChatGPT input height
            'bg-white dark:bg-[#40414f]',
            'text-[#2d333a] dark:text-[#ececf1]',
            'border border-[#c2c8cc] dark:border-[#565869]',
            'placeholder:text-[#6e6e80] dark:placeholder:text-[#8e8ea0]',
            'transition-all duration-150 ease-in-out',

            // Focus state - ChatGPT green glow
            'focus:outline-none focus:border-[#10a37f] focus:shadow-[0_0_0_1px_#10a37f]',
            'dark:focus:border-[#10a37f] dark:focus:shadow-[0_0_0_1px_#10a37f]',

            // Hover state
            'hover:border-[#b4b4be] dark:hover:border-[#676775]',

            // Error state - red border and glow
            error && [
              'border-[#ef4146] focus:border-[#ef4146] focus:shadow-[0_0_0_1px_#ef4146]',
              'dark:border-[#f97583] dark:focus:border-[#f97583] dark:focus:shadow-[0_0_0_1px_#f97583]',
            ],

            // Disabled state
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[#f7f7f8] dark:disabled:bg-[#2a2b32]',

            // Mobile adjustments
            'sm:h-[52px]', // Keep height on small screens and up

            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-[#ef4146] dark:text-[#f97583]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
