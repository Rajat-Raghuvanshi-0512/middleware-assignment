import { ChatLayout } from '@/components/chat-layout';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  return <ChatLayout conversationId={conversationId} />;
}
