"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, AlertCircle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  // Fetch conversations
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["conversations", userId],
    queryFn: async () => {
      const res = await fetch("/api/conversation/list", {
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

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

  // Update conversation mutation
  const updateConversation = useMutation({
    mutationFn: async (payload: { conversationId: string; title: string }) => {
      const res = await fetch("/api/conversation/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update conversation");
      }

      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations", userId] });
      setEditingId(null);
      setEditValue("");
    },
  });

  // Start editing
  const handleStartEdit = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditValue(conversation.title || "");
  };

  // Save edit
  const handleSaveEdit = (conversationId: string) => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== "") {
      updateConversation.mutate({
        conversationId,
        title: trimmedValue,
      });
    } else {
      setEditingId(null);
      setEditValue("");
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  // Handle Enter key
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    conversationId: string
  ) => {
    if (e.key === "Enter") {
      handleSaveEdit(conversationId);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

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
          conversations.map((c: Conversation) => (
            <div
              key={c.id}
              className={`group relative flex items-center gap-2 p-2 rounded text-left text-sm ${
                selectedConversationId === c.id
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              } ${editingId === c.id ? "bg-muted" : ""}`}
              onClick={() => {
                if (editingId !== c.id) {
                  onSelect(c.id);
                }
              }}
            >
              {editingId === c.id ? (
                <Input
                  ref={editInputRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, c.id)}
                  onBlur={() => handleSaveEdit(c.id)}
                  className="h-8 text-sm flex-1"
                  maxLength={255}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span
                    title={c.title || `New Conversation`}
                    className="flex-1 truncate cursor-default"
                  >
                    {c.title || `New Conversation`}
                  </span>
                  <button
                    className={`opacity-0 cursor-pointer group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-background/20 shrink-0 ${
                      selectedConversationId === c.id
                        ? "text-primary-foreground"
                        : "text-muted-foreground"
                    }`}
                    onClick={(e) => handleStartEdit(c, e)}
                    title="Edit conversation name"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
