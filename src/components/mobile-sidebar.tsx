'use client';

import { useState } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { ConversationList } from './conversation-list';

interface MobileSidebarProps {
  selectedConversationId?: string;
  onSelect?: (id: string) => void;
}

export function MobileSidebar({
  selectedConversationId,
  onSelect,
}: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (id: string) => {
    onSelect?.(id);
    setOpen(false); // Close drawer after selection
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction="left">
      <DrawerTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent
        className="h-full w-[280px] rounded-none"
        aria-describedby="sidebar-description"
      >
        <DrawerTitle className="sr-only">Sidebar</DrawerTitle>
        <div id="sidebar-description" className="sr-only">
          Navigation sidebar with conversation list
        </div>
        <ConversationList
          selectedConversationId={selectedConversationId}
          onSelect={handleSelect}
        />
      </DrawerContent>
    </Drawer>
  );
}
