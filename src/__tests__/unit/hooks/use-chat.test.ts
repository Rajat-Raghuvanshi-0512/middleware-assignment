import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMessages, useSendMessage } from '@/hooks/use-chat';
import { mockMessages } from '../../fixtures/messages';
import React from 'react';

// Mock fetch
global.fetch = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
  return Wrapper;
};

const VALID_CONV_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('useMessages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch messages successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: mockMessages }),
    });

    const { result } = renderHook(() => useMessages(VALID_CONV_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ messages: mockMessages });
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/messages/list?conversationId=${VALID_CONV_ID}`,
      { method: 'GET' }
    );
  });

  it('should handle fetch errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to fetch messages' }),
    });

    const { result } = renderHook(() => useMessages(VALID_CONV_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should not fetch when conversationId is empty', () => {
    const { result } = renderHook(() => useMessages(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

describe('useSendMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send message successfully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'Test reply' }),
    });

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      conversationId: VALID_CONV_ID,
      content: 'Test message',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: VALID_CONV_ID,
        content: 'Test message',
      }),
    });
  });

  it('should handle send errors', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to send message' }),
    });

    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      conversationId: VALID_CONV_ID,
      content: 'Test message',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
