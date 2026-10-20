import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversationsApi } from './conversations.api';
import { AIConversation, AIMessage, PaginatedAIMessages } from '../types';
import { queryKeys } from '@/lib/query-keys';

export function useConversations(limit = 50, offset = 0) {
  return useQuery({
    queryKey: [...queryKeys.conversations.list, limit, offset],
    queryFn: () => conversationsApi.list(limit, offset),
    staleTime: 1000 * 60 * 5, // 5 minutes stale time
  });
}

export function useConversation(conversationId: string | null) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(conversationId || ''),
    queryFn: () => conversationsApi.get(conversationId!),
    enabled: !!conversationId,
  });
}

export function useConversationMessages(conversationId: string | null, limit = 20, cursor?: string) {
  return useQuery({
    queryKey: [...queryKeys.conversations.messages(conversationId || ''), limit, cursor || ''],
    queryFn: () => conversationsApi.listMessages(conversationId!, limit, cursor),
    enabled: !!conversationId && conversationId !== 'new',
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title?: string) => conversationsApi.create(title),
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
    },
  });
}

export function useUpdateConversationTitle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      conversationsApi.updateTitle(conversationId, title),
    onSuccess: (updatedConv) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(updatedConv.id) });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => conversationsApi.delete(conversationId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      queryClient.removeQueries({ queryKey: queryKeys.conversations.detail(deletedId) });
      queryClient.removeQueries({ queryKey: queryKeys.conversations.messages(deletedId) });
    },
  });
}

export function useSendChatMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, conversationId }: { content: string; conversationId?: string }) =>
      conversationsApi.sendMessage(content, conversationId),
    onSuccess: (response, variables) => {
      const targetConvId = variables.conversationId || response.conversation_id;
      const isNewConversation = !variables.conversationId;

      if (targetConvId) {
        queryClient.setQueriesData(
          { queryKey: queryKeys.conversations.messages(targetConvId) },
          (oldData: PaginatedAIMessages | undefined) => {
            const userMsg: AIMessage = {
              id: `temp-user-${Date.now()}`,
              conversation_id: targetConvId,
              role: 'user',
              content: variables.content,
              created_at: new Date().toISOString(),
            };
            const assistantMsg: AIMessage = {
              id: response.id || `temp-asst-${Date.now()}`,
              conversation_id: targetConvId,
              role: 'assistant',
              content: response.content,
              created_at: response.created_at || new Date().toISOString(),
            };

            if (!oldData) {
              return {
                messages: [userMsg, assistantMsg],
                next_cursor: null,
              };
            }
            return {
              ...oldData,
              messages: [...oldData.messages, userMsg, assistantMsg],
            };
          }
        );
      }

      if (isNewConversation) {
        queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      }
    },
  });
}
