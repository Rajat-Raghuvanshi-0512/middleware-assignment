import { render, screen } from '../../helpers/render';
import { Sidebar } from '@/components/sidebar';
import { useAuth } from '@clerk/nextjs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mockConversations } from '../../fixtures/conversations';

const VALID_CONV_ID = '550e8400-e29b-41d4-a716-446655440000';

// Mock dependencies
jest.mock('@clerk/nextjs');
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

// Mock next/navigation with jest.fn() so we can override in tests
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockPrefetch = jest.fn();
const mockBack = jest.fn();
const mockForward = jest.fn();
const mockRefresh = jest.fn();
const mockUseRouter = jest.fn(() => ({
  push: mockPush,
  replace: mockReplace,
  prefetch: mockPrefetch,
  back: mockBack,
  forward: mockForward,
  refresh: mockRefresh,
}));
const mockUsePathname = jest.fn(() => '/');

jest.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  usePathname: () => mockUsePathname(),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>;
const mockUseQueryClient = useQueryClient as jest.MockedFunction<
  typeof useQueryClient
>;

describe('Sidebar', () => {
  const mockOnSelect = jest.fn();
  const mockInvalidateQueries = jest.fn();
  const mockQueryClient = {
    invalidateQueries: mockInvalidateQueries,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      userId: 'test-user-id',
      isLoaded: true,
      isSignedIn: true,
    } as ReturnType<typeof useAuth>);

    mockUseQueryClient.mockReturnValue(mockQueryClient as unknown as ReturnType<typeof useQueryClient>);

    mockUseQuery.mockReturnValue({
      data: { conversations: mockConversations },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useQuery>);

    mockUseMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useMutation>);

    // Reset router and pathname mocks
    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      prefetch: mockPrefetch,
      back: mockBack,
      forward: mockForward,
      refresh: mockRefresh,
    });
    mockUsePathname.mockReturnValue('/');
  });

  it('should render sidebar with conversation list', () => {
    render(<Sidebar />);

    // Check if conversations are rendered
    expect(screen.getByText('Test Conversation 1')).toBeInTheDocument();
    expect(screen.getByText('Test Conversation 2')).toBeInTheDocument();
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  it('should have hidden class on mobile and flex on desktop', () => {
    const { container } = render(<Sidebar />);

    const aside = container.querySelector('aside');
    expect(aside).toHaveClass('hidden');
    expect(aside).toHaveClass('md:flex');
  });

  it('should pass selectedConversationId to ConversationList', () => {
    mockUsePathname.mockReturnValue(`/chat/${VALID_CONV_ID}`);

    render(<Sidebar selectedConversationId={VALID_CONV_ID} />);

    const conversation = screen.getByText('Test Conversation 1');
    expect(conversation.closest('div')).toHaveClass('bg-primary');
  });

  it('should pass onSelect callback to ConversationList', () => {
    render(<Sidebar onSelect={mockOnSelect} />);

    const conversation = screen.getByText('Test Conversation 1');
    conversation.click();

    expect(mockOnSelect).toHaveBeenCalledWith(VALID_CONV_ID);
  });

  it('should render UserButton', () => {
    render(<Sidebar />);

    expect(screen.getByTestId('user-button')).toBeInTheDocument();
  });
});

