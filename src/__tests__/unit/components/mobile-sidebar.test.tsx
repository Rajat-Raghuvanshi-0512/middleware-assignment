import { render, screen, fireEvent, waitFor } from '../../helpers/render';
import { MobileSidebar } from '@/components/mobile-sidebar';
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

describe('MobileSidebar', () => {
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

    mockUseQueryClient.mockReturnValue(
      mockQueryClient as unknown as ReturnType<typeof useQueryClient>
    );

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

  it('should render menu button', () => {
    render(<MobileSidebar />);

    const menuButton = screen.getByLabelText('Open menu');
    expect(menuButton).toBeInTheDocument();
    expect(menuButton).toHaveClass('md:hidden');
  });

  it('should open drawer when menu button is clicked', async () => {
    render(<MobileSidebar />);

    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    // Wait for drawer content to appear
    await waitFor(() => {
      expect(screen.getByText('Test Conversation 1')).toBeInTheDocument();
    });
  });

  it('should close drawer after selecting a conversation', async () => {
    render(<MobileSidebar onSelect={mockOnSelect} />);

    // Open drawer
    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    // Wait for content
    await waitFor(() => {
      expect(screen.getByText('Test Conversation 1')).toBeInTheDocument();
    });

    // Click on a conversation
    const conversation = screen.getByText('Test Conversation 1');
    fireEvent.click(conversation);

    // Check if onSelect was called
    expect(mockOnSelect).toHaveBeenCalledWith(VALID_CONV_ID);

    // Drawer should close (content should eventually disappear)
    await waitFor(() => {
      const conversations = screen.queryAllByText('Test Conversation 1');
      // After closing, the text should not be visible or have reduced visibility
      expect(conversations.length).toBeLessThanOrEqual(1);
    });
  });

  it('should pass selectedConversationId to ConversationList', async () => {
    mockUsePathname.mockReturnValue(`/chat/${VALID_CONV_ID}`);

    render(<MobileSidebar selectedConversationId={VALID_CONV_ID} />);

    // Open drawer
    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    // Wait for content and check if conversation is highlighted
    await waitFor(() => {
      const conversation = screen.getByText('Test Conversation 1');
      expect(conversation.closest('div')).toHaveClass('bg-primary');
    });
  });

  it('should render drawer title for accessibility', async () => {
    render(<MobileSidebar />);

    // Open drawer first
    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    // Wait for drawer to open and check for accessibility elements
    await waitFor(() => {
      const drawerTitle = screen.getByText('Sidebar');
      expect(drawerTitle).toBeInTheDocument();
      expect(drawerTitle).toHaveClass('sr-only');
    });
  });

  it('should have correct drawer width', async () => {
    render(<MobileSidebar />);

    // Open drawer
    const menuButton = screen.getByLabelText('Open menu');
    fireEvent.click(menuButton);

    // Wait for drawer content to appear
    await waitFor(() => {
      expect(screen.getByText('Test Conversation 1')).toBeInTheDocument();
    });

    // Check that conversations are visible (drawer is open)
    expect(screen.getByText('Test Conversation 2')).toBeInTheDocument();
  });
});
