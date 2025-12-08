"use client";

import { useState } from "react";
import { ConversationList } from "./conversation-list";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

export function ChatLayout() {
  const [conversationId, setConversationId] = useState<string | null>(null);

  return (
    <div className="flex h-screen">
      <ConversationList
        selectedConversationId={conversationId || undefined}
        onSelect={(id) => setConversationId(id)}
      />

      <div className="flex flex-col flex-1">
        {!conversationId ? (
          <div className="flex items-center justify-center h-full text-xl text-muted-foreground">
            Select a conversation
          </div>
        ) : (
          <>
            <MessageList conversationId={conversationId} />
            <ChatInput conversationId={conversationId} />
          </>
        )}
      </div>
    </div>
  );
}
