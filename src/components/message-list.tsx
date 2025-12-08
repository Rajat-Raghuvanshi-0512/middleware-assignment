'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useMessages } from '@/hooks/use-chat';
import { cn, formatTimestamp } from '@/lib/utils';
import { AlertCircle, Loader2 } from 'lucide-react';
import { MarkdownRenderer } from './markdown-renderer';
import type { MessageResponse } from '@/types/api';

export function MessageList({ conversationId }: { conversationId: string }) {
  const { data, isLoading, error, isError } = useMessages(conversationId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = useMemo(() => data?.messages ?? [], [data?.messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-4 mx-auto max-w-3xl w-full">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'max-w-[80%] p-3 rounded-lg animate-pulse',
                i % 2 === 0 ? 'ml-auto bg-primary/20' : 'mr-auto bg-muted'
              )}
            >
              <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
              <div className="h-4 bg-muted-foreground/20 rounded w-1/2 mt-2" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading messages...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center mx-auto max-w-3xl w-full">
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-destructive/10 text-destructive max-w-md text-center">
          <AlertCircle className="w-6 h-6" />
          <p className="font-medium">Failed to load messages</p>
          <p className="text-sm">
            {error instanceof Error ? error.message : 'An error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          No messages yet. Start the conversation!
        </div>
      ) : (
        <div className="mx-auto max-w-3xl w-full">
          {messages.map((msg: MessageResponse) => (
            <div
              key={msg.id}
              className={cn(
                'p-3 md:p-5 rounded-xl w-[90%] md:w-[80%] my-3 md:my-5 relative',
                msg.role === 'user'
                  ? 'ml-auto bg-primary text-primary-foreground'
                  : 'mr-auto bg-muted'
              )}
            >
              {msg.role === 'assistant' ? (
                <MarkdownRenderer content={msg.content} isUserMessage={false} />
              ) : (
                <div className="whitespace-pre-wrap wrap-break-word">
                  {msg.content}
                </div>
              )}
              {msg.createdAt && (
                <div
                  className={cn(
                    'text-xs mt-2 text-right',
                    msg.role === 'user'
                      ? 'text-primary-foreground/70'
                      : 'text-muted-foreground'
                  )}
                >
                  {formatTimestamp(msg.createdAt)}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
