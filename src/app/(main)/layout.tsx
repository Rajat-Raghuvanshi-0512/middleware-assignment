import { ConversationList } from '@/components/conversation-list';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <ConversationList />
      <div className="flex flex-col flex-1">{children}</div>
    </div>
  );
}
