import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatSidebar } from '@/features/chat/components/chat-sidebar';
import { renderWithProviders } from '@/tests/utils/render';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/features/conversations/api/conversations.queries', () => ({
  useUpdateConversationTitle: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
  useDeleteConversation: () => ({ mutateAsync: vi.fn().mockResolvedValue({}) }),
}));

describe('ChatSidebar component', () => {
  const defaultProps = {
    isSidebarOpen: true,
    setIsSidebarOpen: vi.fn(),
    currentConversationId: 'conv-1',
    conversations: [
      { id: 'conv-1', title: 'First Chat' },
      { id: 'conv-2', title: 'Second Chat' },
    ],
    isLoadingConversations: false,
    user: { name: 'Test User', email: 'test@example.com' },
    logout: vi.fn(),
    isLoggingOut: false,
    onNewChat: vi.fn(),
  };

  it('renders conversation list correctly', () => {
    renderWithProviders(<ChatSidebar {...defaultProps} />);
    expect(screen.getByText('First Chat')).toBeInTheDocument();
    expect(screen.getByText('Second Chat')).toBeInTheDocument();
  });

  it('clicking a conversation navigates to /c/:id', async () => {
    renderWithProviders(<ChatSidebar {...defaultProps} />);
    await userEvent.click(screen.getByText('Second Chat'));
    expect(mockPush).toHaveBeenCalledWith('/c/conv-2');
  });

  it('clicking new chat button triggers onNewChat', async () => {
    const onNewChat = vi.fn();
    renderWithProviders(<ChatSidebar {...defaultProps} onNewChat={onNewChat} />);
    await userEvent.click(screen.getByRole('button', { name: /new chat/i }));
    expect(onNewChat).toHaveBeenCalled();
  });
});
