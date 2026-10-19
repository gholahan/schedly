'use client';

import { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-[400px]">
        {/* Logo/Brand - ChatGPT style centered logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-[var(--color-success)] mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="var(--color-text-inverse)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12V22" stroke="var(--color-text-inverse)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12L4 7" stroke="var(--color-text-inverse)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12L20 7" stroke="var(--color-text-inverse)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Title - ChatGPT typography */}
          <h1 className="text-[32px] font-semibold text-[var(--color-text-primary)] mb-3 tracking-tight leading-tight">
            {title}
          </h1>

          {subtitle && (
            <p className="text-base text-[var(--color-text-secondary)]">
              {subtitle}
            </p>
          )}
        </div>

        {/* Form Content - no card wrapper, just the form */}
        <div className="w-full">
          {children}
        </div>

        {/* Footer - ChatGPT style subtle footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            By continuing, you agree to Schedly's Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
