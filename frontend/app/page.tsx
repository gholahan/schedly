import Link from 'next/link';
import { Calendar, Sparkles, Clock, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] flex flex-col selection:bg-[var(--color-primary)] selection:text-[var(--color-primary-text)]">
      {/* Header / Nav */}
      <header className="sticky top-0 z-50 w-full bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-text)] flex items-center justify-center font-semibold shadow-sm">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-semibold text-lg tracking-tight">Schedly</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors rounded-[var(--radius-control)] hover:bg-[var(--color-surface)]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)] transition-colors rounded-[var(--radius-control)] shadow-sm flex items-center gap-1.5"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-medium text-[var(--color-text-secondary)] mb-8 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          <span>Intelligent Calendar Management Powered by AI</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-[var(--color-text-primary)] leading-[1.1] mb-6 max-w-3xl">
          Your calendar, managed effortlessly.
        </h1>

        <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mb-10 leading-relaxed">
          Schedly is your AI-powered scheduling assistant. Chat naturally to schedule meetings, resolve conflicts, and reclaim your time.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto mb-16">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)] transition-all rounded-[var(--radius-control)] shadow-sm flex items-center justify-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 text-sm font-medium bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] transition-all rounded-[var(--radius-control)] flex items-center justify-center gap-2"
          >
            Sign in to account
          </Link>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full text-left pt-12 border-t border-[var(--color-border)]">
          <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)]">
            <div className="w-8 h-8 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center mb-3 text-[var(--color-primary)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Natural Language AI</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Just type what you need—"Schedule coffee with Sarah next Tuesday at 3pm"—and watch it happen.
            </p>
          </div>

          <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)]">
            <div className="w-8 h-8 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center mb-3 text-[var(--color-primary)]">
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Seamless Sync</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Connects directly with your Google Calendar in real-time.
            </p>
          </div>

          <div className="p-5 rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)]">
            <div className="w-8 h-8 rounded-md bg-[var(--color-background)] border border-[var(--color-border)] flex items-center justify-center mb-3 text-[var(--color-primary)]">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm mb-1">Smart Optimization</h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Automatically protects your focus time and prevents scheduling burnout.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-8 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--color-text-secondary)] gap-4">
        <div>
          © 2026 Schedly. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-[var(--color-text-primary)] transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-[var(--color-text-primary)] transition-colors">
            Terms of Service
          </Link>
        </div>
      </footer>
    </div>
  );
}
