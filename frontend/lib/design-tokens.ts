/**
 * Schedly Design System Tokens
 * Based on ChatGPT UI patterns with custom Indigo palette
 */

export const designTokens = {
  colors: {
    light: {
      // Primary - Indigo (actions, links, focus)
      primary: {
        DEFAULT: '#4F46E5', // Indigo 600
        hover: '#4338CA',   // Indigo 700
        active: '#3730A3',  // Indigo 800
        light: '#6366F1',   // Indigo 500
      },

      // Backgrounds
      background: {
        DEFAULT: '#FFFFFF',
        surface: '#F9FAFB',  // Gray 50 - panels
        hover: '#F3F4F6',    // Gray 100 - hover states
      },

      // Borders
      border: {
        DEFAULT: '#E5E7EB',  // Gray 200
        light: '#F3F4F6',    // Gray 100
        strong: '#D1D5DB',   // Gray 300
      },

      // Text
      text: {
        primary: '#111827',    // Gray 900 - body text
        secondary: '#6B7280',  // Gray 500 - descriptions
        tertiary: '#9CA3AF',   // Gray 400 - placeholders
        inverse: '#FFFFFF',    // White text on dark backgrounds
      },

      // Semantic
      success: {
        DEFAULT: '#10B981',  // Emerald 500
        bg: '#D1FAE5',       // Emerald 100
        text: '#065F46',     // Emerald 800
      },
      warning: {
        DEFAULT: '#F59E0B',  // Amber 500
        bg: '#FEF3C7',       // Amber 100
        text: '#92400E',     // Amber 800
      },
      error: {
        DEFAULT: '#EF4444',  // Red 500
        bg: '#FEE2E2',       // Red 100
        text: '#991B1B',     // Red 800
      },
      info: {
        DEFAULT: '#3B82F6',  // Blue 500
        bg: '#DBEAFE',       // Blue 100
        text: '#1E40AF',     // Blue 800
      },
    },

    dark: {
      // Primary - Indigo (slightly brighter for dark mode)
      primary: {
        DEFAULT: '#6366F1', // Indigo 500
        hover: '#818CF8',   // Indigo 400
        active: '#A5B4FC',  // Indigo 300
        light: '#4F46E5',   // Indigo 600
      },

      // Backgrounds
      background: {
        DEFAULT: '#0F172A',  // Slate 900
        surface: '#1E293B',  // Slate 800 - panels
        hover: '#334155',    // Slate 700 - hover states
      },

      // Borders
      border: {
        DEFAULT: '#334155',  // Slate 700
        light: '#1E293B',    // Slate 800
        strong: '#475569',   // Slate 600
      },

      // Text
      text: {
        primary: '#F1F5F9',    // Slate 100 - body text
        secondary: '#94A3B8',  // Slate 400 - descriptions
        tertiary: '#64748B',   // Slate 500 - placeholders
        inverse: '#0F172A',    // Dark text on light backgrounds
      },

      // Semantic (brighter for dark mode)
      success: {
        DEFAULT: '#34D399',  // Emerald 400
        bg: '#064E3B',       // Emerald 900
        text: '#D1FAE5',     // Emerald 100
      },
      warning: {
        DEFAULT: '#FBBF24',  // Amber 400
        bg: '#78350F',       // Amber 900
        text: '#FEF3C7',     // Amber 100
      },
      error: {
        DEFAULT: '#F87171',  // Red 400
        bg: '#7F1D1D',       // Red 900
        text: '#FEE2E2',     // Red 100
      },
      info: {
        DEFAULT: '#60A5FA',  // Blue 400
        bg: '#1E3A8A',       // Blue 900
        text: '#DBEAFE',     // Blue 100
      },
    },
  },

  typography: {
    fontFamily: {
      sans: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
      mono: 'var(--font-geist-mono), "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
    },
    fontSize: {
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['14px', { lineHeight: '20px' }],
      base: ['16px', { lineHeight: '24px' }],
      lg: ['18px', { lineHeight: '28px' }],
      xl: ['20px', { lineHeight: '28px' }],
      '2xl': ['24px', { lineHeight: '32px' }],
      '3xl': ['30px', { lineHeight: '36px' }],
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  spacing: {
    // 8px base grid (ChatGPT style)
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  borderRadius: {
    none: '0',
    sm: '4px',
    DEFAULT: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },

  transitions: {
    fast: '150ms ease-in-out',
    base: '200ms ease-in-out',
    slow: '300ms ease-in-out',
  },

  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  layout: {
    // ChatGPT-style layout constraints
    sidebarWidth: '260px',
    sidebarCollapsedWidth: '0px',
    maxContentWidth: '768px',
    maxWideContentWidth: '1280px',
  },
} as const;

export type DesignTokens = typeof designTokens;
