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
  },
}));

import { GET } from '@/app/api/messages/list/route';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/drizzle';
import { mockMessages } from '../../../../fixtures/messages';
import { mockConversation } from '../../../../fixtures/conversations';
import type { ConversationResponse, MessageResponse } from '@/types/api';

const mockAuth = auth as jest.MockedFunction<typeof auth>;

type MockDb = {
  query: {
    conversations: {
      findFirst: jest.MockedFunction<
        (options?: { where?: unknown }) => Promise<ConversationResponse | null>
      >;
    };
    messages: {
      findMany: jest.MockedFunction<
        (options?: {
          where?: unknown;
          orderBy?: unknown;
        }) => Promise<MessageResponse[]>
      >;
    };
  };
};

const mockDb = db as unknown as MockDb;

describe('GET /api/messages/list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return messages for authenticated owner', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);
    mockDb.query.conversations.findFirst.mockResolvedValue(mockConversation);
    mockDb.query.messages.findMany.mockResolvedValue(mockMessages);

    const request = new Request(
      'http://localhost/api/messages/list?conversationId=550e8400-e29b-41d4-a716-446655440000'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // Dates are serialized to strings in JSON responses
    expect(data.messages).toHaveLength(mockMessages.length);
    expect(data.messages[0].id).toBe(mockMessages[0].id);
    expect(data.messages[0].content).toBe(mockMessages[0].content);
    expect(data.messages[0].role).toBe(mockMessages[0].role);
    expect(data.messages[0].conversationId).toBe(
      mockMessages[0].conversationId
    );
    expect(typeof data.messages[0].createdAt).toBe('string');
    expect(mockDb.query.messages.findMany).toHaveBeenCalled();
  });

  it('should return 401 for unauthenticated user', async () => {
    mockAuth.mockResolvedValue({ userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const request = new Request(
      'http://localhost/api/messages/list?conversationId=550e8400-e29b-41d4-a716-446655440000'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 404 for non-existent conversation', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);
    mockDb.query.conversations.findFirst.mockResolvedValue(null);

    const request = new Request(
      'http://localhost/api/messages/list?conversationId=550e8400-e29b-41d4-a716-446655440999'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: 'Conversation not found or access denied',
    });
  });

  it('should return 400 for invalid conversationId', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);

    const request = new Request(
      'http://localhost/api/messages/list?conversationId=invalid-uuid'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request parameters');
    expect(data.details).toBeDefined();
  });

  it('should return 400 when conversationId is missing', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);

    const request = new Request('http://localhost/api/messages/list');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request parameters');
  });

  it('should handle database errors', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);
    mockDb.query.conversations.findFirst.mockResolvedValue(mockConversation);
    mockDb.query.messages.findMany.mockRejectedValue(new Error('DB Error'));

    const request = new Request(
      'http://localhost/api/messages/list?conversationId=550e8400-e29b-41d4-a716-446655440000'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});
