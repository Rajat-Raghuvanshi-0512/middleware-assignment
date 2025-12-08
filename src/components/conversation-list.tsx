'use client';

import { useState, useRef, useEffect } from 'react';
import { UserButton } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, AlertCircle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useConversations,
  useCreateConversation,
  useUpdateConversation,
} from '@/hooks/use-chat';
import type { ConversationResponse } from '@/types/api';

export function ConversationList({
  selectedConversationId,
  onSelect,
}: {
  selectedConversationId?: string;
  onSelect?: (id: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Extract conversationId from pathname if on /chat/[conversationId]
  const pathConversationId = pathname?.startsWith('/chat/')
    ? pathname.split('/chat/')[1]?.split('/')[0]
    : undefined;

  // Use pathname conversationId if available, otherwise use prop
  const activeConversationId = pathConversationId || selectedConversationId;

  // Fetch conversations
  const { data, isLoading, error, isError } = useConversations();
  const conversations = data?.conversations ?? [];

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // New conversation mutation
  const createConversation = useCreateConversation();

  // Update conversation mutation
  const updateConversation = useUpdateConversation();

  // Start editing
  const handleStartEdit = (
    conversation: ConversationResponse,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setEditingId(conversation.id);
    setEditValue(conversation.title || '');
  };

  // Save edit
  const handleSaveEdit = (conversationId: string) => {
    const trimmedValue = editValue.trim();
    if (trimmedValue && trimmedValue !== '') {
      updateConversation.mutate(
        {
          conversationId,
          title: trimmedValue,
        },
        {
          onSuccess: () => {
            setEditingId(null);
            setEditValue('');
          },
        }
      );
    } else {
      setEditingId(null);
      setEditValue('');
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  // Handle Enter key
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    conversationId: string
  ) => {
    if (e.key === 'Enter') {
      handleSaveEdit(conversationId);
    } else if (e.key === 'Escape') {
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
      {/* gradient text which moves from left to right */}
      <div className="text-lg font-bold text-center bg-linear-to-b from-slate-300 to-secondary bg-clip-text text-transparent mb-1">
        Middleware Assignment
      </div>
      {/* Start new chat button */}
      <Button
        className="w-full flex items-center justify-center gap-2"
        onClick={() => {
          createConversation.mutate(undefined, {
            onSuccess: (data) => {
              router.push(`/chat/${data.conversationId}`);
              onSelect?.(data.conversationId);
            },
          });
        }}
        disabled={createConversation.isPending}
      >
        <Plus className="w-4 h-4" />
        {createConversation.isPending ? 'Creating...' : 'New Chat'}
      </Button>

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-2 p-2 rounded bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>
            {error instanceof Error
              ? error.message
              : 'Failed to load conversations'}
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
          conversations.map((c: ConversationResponse) => (
            <div
              key={c.id}
              className={`group relative flex items-center gap-2 p-2 rounded text-left text-sm ${
                activeConversationId === c.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              } ${editingId === c.id ? 'bg-muted' : ''}`}
              onClick={() => {
                if (editingId !== c.id) {
                  router.push(`/chat/${c.id}`);
                  onSelect?.(c.id);
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
                      activeConversationId === c.id
                        ? 'text-primary-foreground'
                        : 'text-muted-foreground'
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
      <div className="text-sm text-muted-foreground">
        <UserButton />
      </div>
    </div>
  );
}
