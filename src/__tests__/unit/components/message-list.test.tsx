import { render, screen, waitFor } from '../../helpers/render';
import { MessageList } from '@/components/message-list';
import { useMessages } from '@/hooks/use-chat';
import { mockMessages } from '../../fixtures/messages';

// Mock dependencies
jest.mock('@/hooks/use-chat');

const mockUseMessages = useMessages as jest.MockedFunction<typeof useMessages>;

const VALID_CONV_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('MessageList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    mockUseMessages.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<MessageList conversationId={VALID_CONV_ID} />);

    expect(screen.getByText(/loading messages.../i)).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('generic')
        .some((el) => el.className.includes('animate-pulse'))
    ).toBeTruthy();
  });

  it('should render error state', () => {
    mockUseMessages.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load messages'),
    } as any);

    render(<MessageList conversationId={VALID_CONV_ID} />);

    // Use getAllByText since there are multiple elements with this text
    const errorMessages = screen.getAllByText(/failed to load messages/i);
    expect(errorMessages.length).toBeGreaterThan(0);
    // Check for the error message in the error display
    const errorContainer = errorMessages[0].closest('p');
    expect(errorContainer).toHaveClass('font-medium');
  });

  it('should render empty state when no messages', () => {
    mockUseMessages.mockReturnValue({
      data: { messages: [] },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<MessageList conversationId={VALID_CONV_ID} />);

    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
  });

  it('should render messages correctly', () => {
    mockUseMessages.mockReturnValue({
      data: { messages: mockMessages },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<MessageList conversationId={VALID_CONV_ID} />);

    expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    expect(screen.getByText(/I am doing well/i)).toBeInTheDocument();
    expect(
      screen.getByText('Can you explain React hooks?')
    ).toBeInTheDocument();
  });

  it('should render user messages with correct styling', () => {
    mockUseMessages.mockReturnValue({
      data: { messages: [mockMessages[0]] },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(<MessageList conversationId={VALID_CONV_ID} />);

    const userMessage = container.querySelector('.ml-auto.bg-primary');
    expect(userMessage).toBeInTheDocument();
  });

  it('should render assistant messages with correct styling', () => {
    mockUseMessages.mockReturnValue({
      data: { messages: [mockMessages[1]] },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(<MessageList conversationId={VALID_CONV_ID} />);

    const assistantMessage = container.querySelector('.mr-auto.bg-muted');
    expect(assistantMessage).toBeInTheDocument();
  });

  it('should render markdown for assistant messages', () => {
    const markdownMessage = {
      ...mockMessages[1],
      content: '# Hello\n\nThis is **bold** text.',
    };

    mockUseMessages.mockReturnValue({
      data: { messages: [markdownMessage] },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<MessageList conversationId={VALID_CONV_ID} />);

    // Since we're mocking react-markdown, it renders the raw content
    // Check that the markdown content is present in the rendered output
    expect(screen.getByTestId('react-markdown')).toBeInTheDocument();
    expect(screen.getByText(/# Hello/i)).toBeInTheDocument();
  });

  it('should scroll to bottom when messages change', () => {
    const scrollIntoViewMock = jest.fn();
    HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

    mockUseMessages.mockReturnValue({
      data: { messages: mockMessages },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<MessageList conversationId={VALID_CONV_ID} />);

    waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalled();
    });
  });
});
