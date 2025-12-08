import { render, screen, fireEvent } from '../../helpers/render';
import { ChatLayout } from '@/components/chat-layout';

const VALID_CONV_ID = '550e8400-e29b-41d4-a716-446655440000';

// Mock child components
jest.mock('@/components/conversation-list', () => ({
  ConversationList: ({ onSelect }: { onSelect: (id: string) => void }) => (
    <div data-testid="conversation-list">
      <button onClick={() => onSelect(VALID_CONV_ID)}>Select Conversation</button>
    </div>
  ),
}));

jest.mock('@/components/message-list', () => ({
  MessageList: ({ conversationId }: { conversationId: string }) => (
    <div data-testid="message-list">
      Messages for {conversationId}
    </div>
  ),
}));

jest.mock('@/components/chat-input', () => ({
  ChatInput: ({ conversationId }: { conversationId: string }) => (
    <div data-testid="chat-input">
      Input for {conversationId}
    </div>
  ),
}));

describe('ChatLayout', () => {
  it('should render conversation list', () => {
    render(<ChatLayout />);
    expect(screen.getByTestId('conversation-list')).toBeInTheDocument();
  });

  it('should show placeholder when no conversation is selected', () => {
    render(<ChatLayout />);
    expect(screen.getByText(/select a conversation/i)).toBeInTheDocument();
  });

  it('should render message list and input when conversation is selected', () => {
    render(<ChatLayout />);

    const selectButton = screen.getByText('Select Conversation');
    fireEvent.click(selectButton);

    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
    expect(screen.queryByText(/select a conversation/i)).not.toBeInTheDocument();
  });

  it('should update when different conversation is selected', () => {
    render(<ChatLayout />);

    const selectButton = screen.getByText('Select Conversation');
    fireEvent.click(selectButton);

    expect(screen.getByText(`Messages for ${VALID_CONV_ID}`)).toBeInTheDocument();
    expect(screen.getByText(`Input for ${VALID_CONV_ID}`)).toBeInTheDocument();
  });
});

