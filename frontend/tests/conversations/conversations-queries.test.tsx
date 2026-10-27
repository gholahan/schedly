import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useSendChatMessage,
} from '@/features/conversations/api/conversations.queries';

import { useState } from 'react';

function createWrapper() {
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
      () =>
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
    );
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('conversations queries and mutations', () => {
  it('useConversations fetches list of conversations', async () => {
    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].title).toBe('First Conversation');
  });

  it('useCreateConversation creates a new conversation', async () => {
    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: createWrapper(),
    });

    let newConv: any;
    await waitFor(async () => {
      newConv = await result.current.mutateAsync('Brand New Chat');
    });

    expect(newConv).toBeDefined();
    expect(newConv.title).toBe('Brand New Chat');
  });

  it('useDeleteConversation deletes a conversation', async () => {
    const { result } = renderHook(() => useDeleteConversation(), {
      wrapper: createWrapper(),
    });

    let success = false;
    await waitFor(async () => {
      await result.current.mutateAsync('conv-1');
      success = true;
    });

    expect(success).toBe(true);
  });

  it('useSendChatMessage sends message and returns assistant response', async () => {
    const { result } = renderHook(() => useSendChatMessage(), {
      wrapper: createWrapper(),
    });

    let response: any;
    await waitFor(async () => {
      response = await result.current.mutateAsync({
        content: 'Schedule a meeting tomorrow',
        conversationId: 'conv-1',
      });
    });

    expect(response).toBeDefined();
    expect(response.role).toBe('assistant');
    expect(response.content).toContain('Schedule a meeting tomorrow');
  });
});
