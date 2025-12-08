'use client';

import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { MobileHeader } from './mobile-header';

interface ChatLayoutProps {
  conversationId?: string;
}

export function ChatLayout({ conversationId }: ChatLayoutProps = {}) {
  if (!conversationId) {
    return (
      <>
        <MobileHeader title="Chat" />
        <div className="flex items-center justify-center h-full text-xl text-muted-foreground">
          Select a conversation
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <MobileHeader selectedConversationId={conversationId} title="Chat" />
      <MessageList conversationId={conversationId} />
      <ChatInput conversationId={conversationId} />
    </div>
  );
}
