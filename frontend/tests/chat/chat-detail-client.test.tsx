import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import ChatDetailClient from '@/features/chat/components/chat-detail-client';
import { renderWithProviders } from '@/tests/utils/render';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
  usePathname: () => '/c/conv-1',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/features/chat/components/chat-sidebar', () => ({
  ChatSidebar: () => <div data-testid="mock-sidebar">Sidebar</div>,
}));

vi.mock('@/features/auth/use-auth.hook', () => ({
  useAuth: () => ({
    user: { name: 'Test User', email: 'test@example.com' },
    logout: vi.fn(),
    isLoggingOut: false,
  }),
  useRequireCalendar: () => ({
    isLoading: false,
    isCalendarConnected: true,
  }),
}));

const mockConversations = [{ id: 'conv-1', title: 'Test Conv' }];
const mockMessagesResponse = {
  messages: [
    { id: 'm-1', conversation_id: 'conv-1', role: 'user', content: 'Hello user message', created_at: '2026-10-27T00:00:00.000Z' },
    { id: 'm-2', conversation_id: 'conv-1', role: 'assistant', content: 'Hello **markdown** assistant', created_at: '2026-10-27T00:00:00.000Z' },
  ],
  next_cursor: null,
};

vi.mock('@/features/conversations/api/conversations.queries', () => ({
  useConversations: () => ({
    data: mockConversations,
    isLoading: false,
  }),
  useConversationMessages: () => ({
    data: mockMessagesResponse,
    isLoading: false,
  }),
  useSendChatMessage: () => ({
    mutateAsync: vi.fn().mockResolvedValue({
      id: 'm-3',
      conversation_id: 'conv-1',
      role: 'assistant',
      content: 'AI reply response',
      created_at: new Date().toISOString(),
    }),
    isPending: false,
  }),
  useDeleteConversation: () => ({
    mutateAsync: vi.fn().mockResolvedValue(true),
    isPending: false,
  }),
  useUpdateConversationTitle: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'conv-1', title: 'Updated' }),
    isPending: false,
  }),
}));

describe('ChatDetailClient component', () => {
  it('renders messages list with user message and markdown assistant message', () => {
    renderWithProviders(<ChatDetailClient conversationId="conv-1" />);

    expect(screen.getByText('Hello user message')).toBeInTheDocument();
    expect(screen.getByText('markdown')).toBeInTheDocument();
  });

  it('empty message does not submit', async () => {
    renderWithProviders(<ChatDetailClient conversationId="conv-1" />);
    const textarea = screen.getByPlaceholderText(/ask schedly to schedule/i);
    expect(textarea).toHaveValue('');

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('textarea sends on Enter without Shift', async () => {
    renderWithProviders(<ChatDetailClient conversationId="conv-1" />);
    const textarea = screen.getByPlaceholderText(/ask schedly to schedule/i);

    fireEvent.change(textarea, { target: { value: 'Schedule meeting' } });
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText('Schedule meeting')).toBeInTheDocument();
    });
  });
});
