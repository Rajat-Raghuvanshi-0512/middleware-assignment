import { render, screen, fireEvent, waitFor } from '../../helpers/render';
import { MobileHeader } from '@/components/mobile-header';
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

// Mock next/navigation
const mockPush = jest.fn();
const mockUseRouter = jest.fn(() => ({
  push: mockPush,
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
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

describe('MobileHeader', () => {
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

    mockUseRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    });
    mockUsePathname.mockReturnValue('/');
  });

  it('should render header with default title', () => {
    render(<MobileHeader />);

    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  it('should render header with custom title', () => {
    render(<MobileHeader title="My Custom Title" />);

    expect(screen.getByText('My Custom Title')).toBeInTheDocument();
  });

  it('should have mobile-only class', () => {
    const { container } = render(<MobileHeader />);

    const header = container.querySelector('header');
    expect(header).toHaveClass('md:hidden');
  });

  it('should be sticky at top', () => {
    const { container } = render(<MobileHeader />);

    const header = container.querySelector('header');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('top-0');
  });

  it('should render mobile sidebar with menu button', () => {
    render(<MobileHeader />);

    const menuButton = screen.getByLabelText('Open menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('should pass selectedConversationId to mobile sidebar', async () => {
    mockUsePathname.mockReturnValue(`/chat/${VALID_CONV_ID}`);

    render(<MobileHeader selectedConversationId={VALID_CONV_ID} />);

    // Open drawer
    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    // Wait for content
    await waitFor(() => {
      const conversation = screen.getByText('Test Conversation 1');
      expect(conversation.closest('div')).toHaveClass('bg-primary');
    });
  });

  it('should pass onSelect callback to mobile sidebar', async () => {
    render(<MobileHeader onSelect={mockOnSelect} />);

    // Open drawer
    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    // Wait for content
    await waitFor(() => {
      expect(screen.getByText('Test Conversation 1')).toBeInTheDocument();
    });

    // Click on conversation
    const conversation = screen.getByText('Test Conversation 1');
    fireEvent.click(conversation);

    expect(mockOnSelect).toHaveBeenCalledWith(VALID_CONV_ID);
  });

  it('should have backdrop blur effect', () => {
    const { container } = render(<MobileHeader />);

    const header = container.querySelector('header');
    expect(header).toHaveClass('backdrop-blur');
    expect(header).toHaveClass('bg-background/95');
  });

  it('should truncate long titles', () => {
    render(<MobileHeader title="This is a very long title that should be truncated" />);

    const title = screen.getByText('This is a very long title that should be truncated');
    expect(title).toHaveClass('truncate');
  });
});

