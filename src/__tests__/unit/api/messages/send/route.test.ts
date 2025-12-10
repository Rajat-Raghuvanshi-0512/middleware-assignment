// Mock dependencies BEFORE imports
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/db/drizzle', () => ({
  db: {
    query: {
      conversations: {
        findFirst: jest.fn(),
      },
      messages: {
        findMany: jest.fn(),
      },
    },
    insert: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('groq-sdk', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

jest.mock('@/lib/memory', () => ({
  getUserMemory: jest.fn(),
  updateUserMemory: jest.fn(),
}));

jest.mock('@/lib/prompts', () => ({
  buildMessagesWithMemory: jest.fn(),
}));

import { POST } from '@/app/api/messages/send/route';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/drizzle';
import Groq from 'groq-sdk';
import { getUserMemory, updateUserMemory } from '@/lib/memory';
import { buildMessagesWithMemory } from '@/lib/prompts';
import { mockConversation } from '../../../../fixtures/conversations';
import { mockMessages } from '../../../../fixtures/messages';
import type { ConversationResponse, MessageResponse } from '@/types/api';

const mockAuth = auth as jest.MockedFunction<typeof auth>;
const MockGroq = Groq as jest.MockedClass<typeof Groq>;
const mockGetUserMemory = getUserMemory as jest.MockedFunction<typeof getUserMemory>;
const mockUpdateUserMemory = updateUserMemory as jest.MockedFunction<typeof updateUserMemory>;
const mockBuildMessagesWithMemory = buildMessagesWithMemory as jest.MockedFunction<typeof buildMessagesWithMemory>;

type MockDb = {
  query: {
    conversations: {
      findFirst: jest.MockedFunction<
        (options?: { where?: unknown }) => Promise<ConversationResponse | null>
      >;
    };
    messages: {
      findMany: jest.MockedFunction<
        (options?: { where?: unknown }) => Promise<MessageResponse[]>
      >;
    };
  };
  insert: jest.MockedFunction<
    (table: unknown) => {
      values: jest.MockedFunction<
        (values: unknown) => {
          returning: jest.MockedFunction<() => Promise<MessageResponse[]>>;
        }
      >;
    }
  >;
  update: jest.MockedFunction<
    (table: unknown) => {
      set: jest.MockedFunction<
        (values: { title: string }) => {
          where: jest.MockedFunction<(condition: unknown) => Promise<void>>;
        }
      >;
    }
  >;
};

const mockDb = db as unknown as MockDb;

// Valid UUIDs for testing
const VALID_CONV_ID = '550e8400-e29b-41d4-a716-446655440000';
const NON_EXISTENT_CONV_ID = '550e8400-e29b-41d4-a716-446655440999';

type MockGroqInstance = {
  chat: {
    completions: {
      create: jest.MockedFunction<
        (options: unknown) => Promise<{
          choices: Array<{ message: { content: string } }>;
        }>
      >;
    };
  };
};

describe('POST /api/messages/send', () => {
  let mockGroqInstance: MockGroqInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGroqInstance = {
      chat: {
        completions: {
          create: jest
            .fn<
              Promise<{
                choices: Array<{ message: { content: string } }>;
              }>,
              [unknown]
            >()
            .mockResolvedValue({
              choices: [
                {
                  message: {
                    content: 'AI response',
                  },
                },
              ],
            }),
        },
      },
    };
    MockGroq.mockImplementation(() => mockGroqInstance as unknown as Groq);
    
    // Mock memory functions with default implementations
    mockGetUserMemory.mockResolvedValue(null);
    mockUpdateUserMemory.mockResolvedValue({
      id: 'memory-id',
      userId: 'test-user-id',
      facts: [],
      messageCount: 0,
      lastProcessedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockBuildMessagesWithMemory.mockImplementation((history, _memory, _userMessage) => {
      return [
        { role: 'system', content: 'You are a helpful assistant.' },
        ...history.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      ];
    });
  });

  it('should send message and get AI response', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);
    mockDb.query.conversations.findFirst.mockResolvedValue(mockConversation);
    mockDb.query.messages.findMany.mockResolvedValue(mockMessages);
    
    const mockReturning = jest.fn().mockResolvedValue([{
      id: 'msg-id',
      conversationId: VALID_CONV_ID,
      role: 'user',
      content: 'Hello',
      createdAt: new Date(),
    }]);
    const mockValues = jest.fn().mockReturnValue({
      returning: mockReturning,
    });
    
    mockDb.insert.mockReturnValue({
      values: mockValues,
    });
    mockDb.update.mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      }),
    });

    const request = new Request('http://localhost/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: VALID_CONV_ID,
        content: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ reply: 'AI response' });
    expect(mockDb.insert).toHaveBeenCalledTimes(2); // User message + AI response
    expect(mockGroqInstance.chat.completions.create).toHaveBeenCalled();
  });

  it('should return 401 for unauthenticated user', async () => {
    mockAuth.mockResolvedValue({ userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const request = new Request('http://localhost/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: VALID_CONV_ID,
        content: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 404 for non-existent conversation', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);
    mockDb.query.conversations.findFirst.mockResolvedValue(null);

    const request = new Request('http://localhost/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: NON_EXISTENT_CONV_ID,
        content: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: 'Conversation not found or access denied',
    });
  });

  it('should return 400 for invalid request data', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);

    const request = new Request('http://localhost/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: 'invalid-uuid',
        content: '',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request data');
  });

  it('should return 500 when Groq API key is missing', async () => {
    const originalEnv = process.env.GROQ_API_KEY;
    delete process.env.GROQ_API_KEY;

    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);
    mockDb.query.conversations.findFirst.mockResolvedValue(mockConversation);
    mockDb.query.messages.findMany.mockResolvedValue(mockMessages);
    
    const mockReturning = jest.fn().mockResolvedValue([{
      id: 'msg-id',
      conversationId: VALID_CONV_ID,
      role: 'user',
      content: 'Hello',
      createdAt: new Date(),
    }]);
    const mockValues = jest.fn().mockReturnValue({
      returning: mockReturning,
    });
    
    mockDb.insert.mockReturnValue({
      values: mockValues,
    });

    const request = new Request('http://localhost/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: VALID_CONV_ID,
        content: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Groq API key not configured' });

    process.env.GROQ_API_KEY = originalEnv;
  });

  it('should return 500 when AI response is empty', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);
    mockDb.query.conversations.findFirst.mockResolvedValue(mockConversation);
    mockDb.query.messages.findMany.mockResolvedValue(mockMessages);
    
    const mockReturning = jest.fn().mockResolvedValue([{
      id: 'msg-id',
      conversationId: VALID_CONV_ID,
      role: 'user',
      content: 'Hello',
      createdAt: new Date(),
    }]);
    const mockValues = jest.fn().mockReturnValue({
      returning: mockReturning,
    });
    
    mockDb.insert.mockReturnValue({
      values: mockValues,
    });
    mockGroqInstance.chat.completions.create.mockResolvedValue({
      choices: [{ message: { content: '' } }],
    });

    const request = new Request('http://localhost/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: VALID_CONV_ID,
        content: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to generate response' });
  });

  it('should update conversation title on first message', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);
    mockDb.query.conversations.findFirst.mockResolvedValue({
      ...mockConversation,
      title: null,
    });
    mockDb.query.messages.findMany.mockResolvedValue([mockMessages[0]]); // Only one message
    
    const mockReturning = jest.fn().mockResolvedValue([{
      id: 'msg-id',
      conversationId: VALID_CONV_ID,
      role: 'user',
      content: 'This is a long message that should be truncated for title',
      createdAt: new Date(),
    }]);
    const mockValues = jest.fn().mockReturnValue({
      returning: mockReturning,
    });
    
    mockDb.insert.mockReturnValue({
      values: mockValues,
    });

    const mockWhere = jest.fn().mockResolvedValue(undefined);
    const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    mockDb.update.mockReturnValue({ set: mockSet });

    const request = new Request('http://localhost/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: VALID_CONV_ID,
        content: 'This is a long message that should be truncated for title',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({
      title: expect.stringMatching(/^This is a long message that should be/),
    });
  });

  it('should handle database errors', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);
    mockDb.query.conversations.findFirst.mockResolvedValue(mockConversation);
    mockDb.query.messages.findMany.mockRejectedValue(new Error('DB Error'));

    const request = new Request('http://localhost/api/messages/send', {
      method: 'POST',
      body: JSON.stringify({
        conversationId: VALID_CONV_ID,
        content: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});
