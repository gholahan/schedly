// TanStack Query key factory for consistent cache keys across the app

export const queryKeys = {
  // Auth keys
  auth: {
    all: ['auth'] as const,
    me: ['auth', 'me'] as const,
  },

  // User keys
  users: {
    all: ['users'] as const,
    profile: ['users', 'profile'] as const,
  },

  // Conversations keys (to be used later)
  conversations: {
    all: ['conversations'] as const,
    list: ['conversations', 'list'] as const,
    detail: (id: string) => ['conversations', 'detail', id] as const,
    messages: (id: string) => ['conversations', 'messages', id] as const,
  },

  // Preferences keys (to be used later)
  preferences: {
    all: ['preferences'] as const,
    current: ['preferences', 'current'] as const,
  },
} as const;
