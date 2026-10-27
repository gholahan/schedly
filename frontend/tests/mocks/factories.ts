export function makeUser(overrides = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    plan: 'free',
    credits: 100,
    has_google_calendar: true,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeConversation(overrides = {}) {
  return {
    id: 'conv-123',
    user_id: 'user-123',
    title: 'Test Conversation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makeMessage(overrides = {}) {
  return {
    id: 'msg-123',
    conversation_id: 'conv-123',
    role: 'user',
    content: 'Hello World',
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

export function makePreferences(overrides = {}) {
  return {
    id: 'pref-123',
    user_id: 'user-123',
    theme: 'dark',
    timezone: 'UTC',
    working_hours_start: '09:00',
    working_hours_end: '17:00',
    ...overrides,
  };
}
