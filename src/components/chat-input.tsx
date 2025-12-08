'use client';

import { useState, useRef, useEffect } from 'react';
import { useSendMessage } from '@/hooks/use-chat';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function ChatInput({ conversationId }: { conversationId: string }) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessage = useSendMessage();

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 200; // Max height in pixels (about 8-9 lines)
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [value]);

  const send = () => {
    if (!value.trim()) return;
    if (sendMessage.isPending) return;

    sendMessage.mutate(
      { conversationId, content: value.trim() },
      {
        onSuccess: () => {
          setValue('');
          // Reset textarea height
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        },
        onError: (error) => {
          toast.error(
            error instanceof Error
              ? error.message
              : 'Failed to send message. Please try again.'
          );
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 max-w-3xl mx-auto w-full">
      {sendMessage.isError && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>
              {sendMessage.error instanceof Error
                ? sendMessage.error.message
                : 'Failed to send message'}
            </span>
          </div>
        </div>
      )}
      <div className="p-4">
        <div className="relative flex items-end gap-3">
          <div className="relative flex-1">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message… (Press Enter to send, Shift+Enter for new line)"
              disabled={sendMessage.isPending}
              maxLength={10000}
              rows={1}
              className={cn(
                'resize-none pr-12 py-3',
                'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent'
              )}
            />
            {value.length > 9000 && (
              <div className="absolute bottom-2 right-3 pointer-events-none">
                <span
                  className={cn(
                    'text-xs font-medium bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded',
                    value.length > 9900
                      ? 'text-destructive'
                      : value.length > 9500
                      ? 'text-warning'
                      : 'text-muted-foreground'
                  )}
                >
                  {value.length}/10000
                </span>
              </div>
            )}
          </div>
          <Button
            onClick={send}
            disabled={sendMessage.isPending || !value.trim()}
            size="icon"
            className={cn(
              'h-11 w-11 shrink-0 rounded-full shadow-md transition-all',
              'hover:scale-105 active:scale-95',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
            )}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Press{' '}
          <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">
            Enter
          </kbd>{' '}
          to send,{' '}
          <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">
            Shift
          </kbd>{' '}
          +{' '}
          <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-muted rounded border">
            Enter
          </kbd>{' '}
          for new line
        </p>
      </div>
    </div>
  );
}
