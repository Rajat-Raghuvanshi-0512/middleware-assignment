'use client';

import { MessageList } from './message-list';
import { ChatInput } from './chat-input';

interface ChatLayoutProps {
  conversationId?: string;
}

export function ChatLayout({ conversationId }: ChatLayoutProps = {}) {
  if (!conversationId) {
    return (
      <div className="flex items-center justify-center h-full text-xl text-muted-foreground">
        Select a conversation
      </div>
    );
  }

  return (
    <>
      <MessageList conversationId={conversationId} />
      <ChatInput conversationId={conversationId} />
    </>
  );
}
