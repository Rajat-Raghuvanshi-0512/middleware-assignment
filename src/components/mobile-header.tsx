'use client';

import { MobileSidebar } from './mobile-sidebar';

interface MobileHeaderProps {
  selectedConversationId?: string;
  onSelect?: (id: string) => void;
  title?: string;
}

export function MobileHeader({
  selectedConversationId,
  onSelect,
  title,
}: MobileHeaderProps) {
  return (
    <header className="md:hidden sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4 py-3">
      <MobileSidebar
        selectedConversationId={selectedConversationId}
        onSelect={onSelect}
      />
      <h1 className="text-lg font-semibold truncate">{title || 'Chat'}</h1>
    </header>
  );
}
