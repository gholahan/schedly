import { apiClient } from '@/lib/axios';
import { AIConversation, AIMessage, PaginatedAIMessages } from '../types';

export const conversationsApi = {
  list: async (limit = 50, offset = 0): Promise<AIConversation[]> => {
    const response = await apiClient.get<AIConversation[]>('/agent/conversations', {
      params: { limit, offset },
    });
    return response.data;
  },

  create: async (title?: string): Promise<AIConversation> => {
    const response = await apiClient.post<AIConversation>('/agent/conversations', {
      title,
    });
    return response.data;
  },

  get: async (conversationId: string): Promise<AIConversation> => {
    const response = await apiClient.get<AIConversation>(`/agent/conversations/${conversationId}`);
    return response.data;
  },

  updateTitle: async (conversationId: string, title: string): Promise<AIConversation> => {
    const response = await apiClient.patch<AIConversation>(`/agent/conversations/${conversationId}`, {
      title,
    });
    return response.data;
  },

  delete: async (conversationId: string): Promise<void> => {
    await apiClient.delete(`/agent/conversations/${conversationId}`);
  },

  listMessages: async (
    conversationId: string,
    limit = 20,
    cursor?: string
  ): Promise<PaginatedAIMessages> => {
    const response = await apiClient.get<PaginatedAIMessages>(
      `/agent/conversations/${conversationId}/messages`,
      {
        params: { limit, cursor },
      }
    );
    return response.data;
  },

  sendMessage: async (content: string, conversationId?: string): Promise<AIMessage> => {
    const response = await apiClient.post<AIMessage>('/agent/chat', {
      content,
      conversation_id: conversationId,
    });
    return response.data;
  },
};
