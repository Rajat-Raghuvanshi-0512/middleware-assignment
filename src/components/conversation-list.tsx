"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Conversation {
  id: string;
  title: string | null;
  createdAt: Date | string;
}

export function ConversationList({
  selectedConversationId,
  onSelect,
}: {
  selectedConversationId?: string;
  onSelect: (id: string) => void;
}) {
  const { userId } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch conversations
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["conversations", userId, page, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`/api/conversation/list?${params}`, {
        method: "GET",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch conversations");
      }

      return res.json();
    },
    enabled: !!userId,
  });

  const conversations = data?.conversations ?? [];
  const pagination = data?.pagination;

  // New conversation mutation
  const createConversation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/conversation/start", {
        method: "POST",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create conversation");
      }

      return res.json();
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["conversations", userId] });
      onSelect(data.conversationId); // auto-select new chat
    },
  });

  return (
    <div className="flex flex-col gap-4 p-4 border-r h-full w-64 bg-muted/30">
      {/* Start new chat button */}
      <Button
        className="w-full flex items-center justify-center gap-2"
        onClick={() => createConversation.mutate()}
        disabled={createConversation.isPending}
      >
        <Plus className="w-4 h-4" />
        {createConversation.isPending ? "Creating..." : "New Chat"}
      </Button>

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>
            {error instanceof Error
              ? error.message
              : "Failed to load conversations"}
          </span>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No conversations yet
          </div>
        ) : (
          <>
            {conversations.map((c: Conversation) => (
              <button
                key={c.id}
                className={`p-2 rounded text-left text-sm truncate ${
                  selectedConversationId === c.id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => onSelect(c.id)}
                title={c.title || `Conversation ${c.id.slice(0, 8)}`}
              >
                {c.title || `New Conversation`}
              </button>
            ))}
            {pagination?.hasMore && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                className="mt-2"
              >
                Load More
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
