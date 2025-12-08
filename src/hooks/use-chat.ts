"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MessagesAPI, ErrorResponse } from "@/types/api";

export const useMessages = (conversationId: string) => {
  return useQuery<MessagesAPI.ListResponse, Error>({
    queryKey: ["messages", conversationId],
    queryFn: async (): Promise<MessagesAPI.ListResponse> => {
      const params = new URLSearchParams({
        conversationId,
      });
      const res = await fetch(`/api/messages/list?${params}`, {
        method: "GET",
      });

      if (!res.ok) {
        const error: ErrorResponse = await res.json();
        throw new Error(error.error || "Failed to fetch messages");
      }

      const data: MessagesAPI.ListResponse = await res.json();
      return data;
    },
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const qc = useQueryClient();

  return useMutation<
    MessagesAPI.SendResponse,
    Error,
    MessagesAPI.SendRequest
  >({
    mutationFn: async (
      payload: MessagesAPI.SendRequest
    ): Promise<MessagesAPI.SendResponse> => {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error: ErrorResponse = await res.json();
        throw new Error(error.error || "Failed to send message");
      }

      const data: MessagesAPI.SendResponse = await res.json();
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate messages queries for this conversation
      qc.invalidateQueries({
        queryKey: ["messages", variables.conversationId],
      });
      // Invalidate conversations to update title if needed
      qc.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });
};
