import { render, screen, fireEvent, waitFor } from '../../helpers/render';
import { act } from '@testing-library/react';
import { ChatInput } from '@/components/chat-input';
import { useSendMessage } from '@/hooks/use-chat';
import type { UseMutationResult } from '@tanstack/react-query';
import type { MessagesAPI } from '@/types/api';

// Mock dependencies
jest.mock('@/hooks/use-chat');
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

const mockUseSendMessage = useSendMessage as jest.MockedFunction<
  typeof useSendMessage
>;

const VALID_CONV_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('ChatInput', () => {
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSendMessage.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      error: null,
    } as unknown as UseMutationResult<MessagesAPI.SendResponse, Error, MessagesAPI.SendRequest, unknown>);
  });

  it('should render input and send button', () => {
    render(<ChatInput conversationId={VALID_CONV_ID} />);

    expect(
      screen.getByPlaceholderText('Type your message…')
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should update input value when typing', () => {
    render(<ChatInput conversationId={VALID_CONV_ID} />);

    const input = screen.getByPlaceholderText('Type your message…');
    act(() => {
      fireEvent.change(input, { target: { value: 'Hello' } });
    });

    expect(input).toHaveValue('Hello');
  });

  it('should send message when clicking send button', () => {
    render(<ChatInput conversationId={VALID_CONV_ID} />);

    const input = screen.getByPlaceholderText('Type your message…');
    const button = screen.getByRole('button', { name: /send/i });

    act(() => {
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(button);
    });

    expect(mockMutate).toHaveBeenCalledWith(
      { conversationId: VALID_CONV_ID, content: 'Test message' },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it('should send message when pressing Enter', () => {
    render(<ChatInput conversationId={VALID_CONV_ID} />);

    const input = screen.getByPlaceholderText('Type your message…');
    act(() => {
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    });

    expect(mockMutate).toHaveBeenCalled();
  });

  it('should not send message when pressing Shift+Enter', () => {
    render(<ChatInput conversationId={VALID_CONV_ID} />);

    const input = screen.getByPlaceholderText('Type your message…');
    act(() => {
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should not send empty messages', () => {
    render(<ChatInput conversationId={VALID_CONV_ID} />);

    const button = screen.getByRole('button', { name: /send/i });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should not send message with only whitespace', () => {
    render(<ChatInput conversationId={VALID_CONV_ID} />);

    const input = screen.getByPlaceholderText('Type your message…');
    const button = screen.getByRole('button', { name: /send/i });

    act(() => {
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(button);
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should clear input after successful send', async () => {
    render(<ChatInput conversationId={VALID_CONV_ID} />);

    const input = screen.getByPlaceholderText('Type your message…');

    act(() => {
      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(screen.getByRole('button', { name: /send/i }));
    });

    // Get the onSuccess callback and call it within act
    const lastCall = mockMutate.mock.calls[mockMutate.mock.calls.length - 1];
    if (lastCall && lastCall[1]?.onSuccess) {
      await act(async () => {
        lastCall[1].onSuccess();
      });
    }

    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('should show loading state when sending', () => {
    mockUseSendMessage.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as unknown as UseMutationResult<MessagesAPI.SendResponse, Error, MessagesAPI.SendRequest, unknown>);

    render(<ChatInput conversationId={VALID_CONV_ID} />);

    expect(screen.getByText(/sending.../i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type your message…')).toBeDisabled();
    expect(screen.getByRole('button', { name: /sending.../i })).toBeDisabled();
  });

  it('should show error message when send fails', () => {
    mockUseSendMessage.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error('Failed to send message'),
    } as unknown as UseMutationResult<MessagesAPI.SendResponse, Error, MessagesAPI.SendRequest, unknown>);

    render(<ChatInput conversationId={VALID_CONV_ID} />);

    expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
  });

  it('should show character count when approaching limit', () => {
    render(<ChatInput conversationId={VALID_CONV_ID} />);

    const input = screen.getByPlaceholderText('Type your message…');
    const longText = 'a'.repeat(9001);
    act(() => {
      fireEvent.change(input, { target: { value: longText } });
    });

    expect(screen.getByText(/9001\/10000 characters/i)).toBeInTheDocument();
  });

  it('should not send when already pending', () => {
    mockUseSendMessage.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
      isError: false,
      error: null,
    } as unknown as UseMutationResult<MessagesAPI.SendResponse, Error, MessagesAPI.SendRequest, unknown>);

    render(<ChatInput conversationId={VALID_CONV_ID} />);

    const input = screen.getByPlaceholderText('Type your message…');
    act(() => {
      fireEvent.change(input, { target: { value: 'Test' } });
      fireEvent.keyDown(input, { key: 'Enter', shiftKey: false });
    });

    // Should not call mutate again if already pending
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
