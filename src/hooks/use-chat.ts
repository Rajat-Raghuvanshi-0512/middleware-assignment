"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useMessages = (conversationId: string, page = 1, limit = 50) => {
  return useQuery({
    queryKey: ["messages", conversationId, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        conversationId,
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/messages/list?${params}`, {
        method: "GET",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch messages");
      }

      const data = await res.json();
      return data;
    },
    enabled: !!conversationId,
  });
};

export const useSendMessage = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      conversationId: string;
      content: string;
    }) => {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to send message");
      }

      return res.json();
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
