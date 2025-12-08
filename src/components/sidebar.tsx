'use client';

import { ConversationList } from './conversation-list';

interface SidebarProps {
  selectedConversationId?: string;
  onSelect?: (id: string) => void;
}

export function Sidebar({ selectedConversationId, onSelect }: SidebarProps) {
  return (
    <aside className="hidden md:flex h-screen">
      <ConversationList
        selectedConversationId={selectedConversationId}
        onSelect={onSelect}
      />
    </aside>
  );
}

