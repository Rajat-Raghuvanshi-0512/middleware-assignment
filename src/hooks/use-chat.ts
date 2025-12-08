'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessagesAPI, ConversationAPI, ErrorResponse } from '@/types/api';
import { useAuth } from '@clerk/nextjs';

// Messages hooks
export const useMessages = (conversationId: string) => {
  return useQuery<MessagesAPI.ListResponse, Error>({
    queryKey: ['messages', conversationId],
    queryFn: async (): Promise<MessagesAPI.ListResponse> => {
      const params = new URLSearchParams({
        conversationId,
      });
      const res = await fetch(`/api/messages/list?${params}`, {
        method: 'GET',
      });

      if (!res.ok) {
        const error: ErrorResponse = await res.json();
        throw new Error(error.error || 'Failed to fetch messages');
      }

      const data: MessagesAPI.ListResponse = await res.json();
      return data;
    },
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const qc = useQueryClient();

  return useMutation<MessagesAPI.SendResponse, Error, MessagesAPI.SendRequest>({
    mutationFn: async (
      payload: MessagesAPI.SendRequest
    ): Promise<MessagesAPI.SendResponse> => {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error: ErrorResponse = await res.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const data: MessagesAPI.SendResponse = await res.json();
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate messages queries for this conversation
      qc.invalidateQueries({
        queryKey: ['messages', variables.conversationId],
      });
      // Invalidate conversations to update title if needed
      qc.invalidateQueries({
        queryKey: ['conversations'],
      });
    },
  });
};

// Conversation hooks
export const useConversations = () => {
  const { userId } = useAuth();

  return useQuery<ConversationAPI.ListResponse, Error>({
    queryKey: ['conversations', userId],
    queryFn: async (): Promise<ConversationAPI.ListResponse> => {
      const res = await fetch('/api/conversation/list', {
        method: 'GET',
      });

      if (!res.ok) {
        const error: ErrorResponse = await res.json();
        throw new Error(error.error || 'Failed to fetch conversations');
      }

      const data: ConversationAPI.ListResponse = await res.json();
      return data;
    },
    enabled: !!userId,
  });
};

export const useCreateConversation = () => {
  const qc = useQueryClient();
  const { userId } = useAuth();

  return useMutation<ConversationAPI.StartResponse, Error>({
    mutationFn: async (): Promise<ConversationAPI.StartResponse> => {
      const res = await fetch('/api/conversation/start', {
        method: 'POST',
      });

      if (!res.ok) {
        const error: ErrorResponse = await res.json();
        throw new Error(error.error || 'Failed to create conversation');
      }

      const data: ConversationAPI.StartResponse = await res.json();
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations', userId] });
    },
  });
};

export const useUpdateConversation = () => {
  const qc = useQueryClient();
  const { userId } = useAuth();

  return useMutation<
    ConversationAPI.UpdateResponse,
    Error,
    ConversationAPI.UpdateRequest
  >({
    mutationFn: async (
      payload: ConversationAPI.UpdateRequest
    ): Promise<ConversationAPI.UpdateResponse> => {
      const res = await fetch('/api/conversation/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error: ErrorResponse = await res.json();
        throw new Error(error.error || 'Failed to update conversation');
      }

      const data: ConversationAPI.UpdateResponse = await res.json();
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations', userId] });
    },
  });
};
