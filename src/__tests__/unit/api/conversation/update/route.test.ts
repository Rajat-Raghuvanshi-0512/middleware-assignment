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
    },
    update: jest.fn(),
  },
}));

import { PATCH } from '@/app/api/conversation/update/route';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/drizzle';
import { mockConversation } from '../../../../fixtures/conversations';
import type { ConversationResponse } from '@/types/api';

const mockAuth = auth as jest.MockedFunction<typeof auth>;

type MockDb = {
  query: {
    conversations: {
      findFirst: jest.MockedFunction<
        (options?: { where?: unknown }) => Promise<ConversationResponse | null>
      >;
    };
  };
  update: jest.MockedFunction<
    (table: unknown) => {
      set: jest.MockedFunction<
        (values: { title: string }) => {
          where: jest.MockedFunction<
            (condition: unknown) => {
              returning: jest.MockedFunction<
                () => Promise<[ConversationResponse]>
              >;
            }
          >;
        }
      >;
    }
  >;
};

const mockDb = db as unknown as MockDb;

// Valid UUIDs for testing
const VALID_CONV_ID = '550e8400-e29b-41d4-a716-446655440000';
const NON_EXISTENT_CONV_ID = '550e8400-e29b-41d4-a716-446655440999';

describe('PATCH /api/conversation/update', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update conversation title for authenticated owner', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);
    mockDb.query.conversations.findFirst.mockResolvedValue(mockConversation);

    const updatedConversation = {
      ...mockConversation,
      title: 'Updated Title',
    };
    const mockReturning = jest
      .fn<Promise<[ConversationResponse]>, []>()
      .mockResolvedValue([updatedConversation]);
    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    mockDb.update.mockReturnValue({ set: mockSet });

    const request = new Request('http://localhost/api/conversation/update', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: VALID_CONV_ID,
        title: 'Updated Title',
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.conversation.title).toBe('Updated Title');
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('should return 401 for unauthenticated user', async () => {
    mockAuth.mockResolvedValue({ userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const request = new Request('http://localhost/api/conversation/update', {
      method: 'PATCH',
      body: JSON.stringify({
        conversationId: VALID_CONV_ID,
        title: 'Updated Title',
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
  });

  it('should return 404 for non-existent conversation', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);
    mockDb.query.conversations.findFirst.mockResolvedValue(null);

    const request = new Request('http://localhost/api/conversation/update', {
      method: 'PATCH',
      body: JSON.stringify({
        conversationId: NON_EXISTENT_CONV_ID,
        title: 'Updated Title',
      }),
    });

    const response = await PATCH(request);
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

    const request = new Request('http://localhost/api/conversation/update', {
      method: 'PATCH',
      body: JSON.stringify({
        conversationId: 'invalid-uuid',
        title: '',
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request data');
    expect(data.details).toBeDefined();
  });

  it('should handle database errors', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);
    mockDb.query.conversations.findFirst.mockResolvedValue(mockConversation);

    const mockReturning = jest
      .fn<Promise<[ConversationResponse]>, []>()
      .mockRejectedValue(new Error('DB Error'));
    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    mockDb.update.mockReturnValue({ set: mockSet });

    const request = new Request('http://localhost/api/conversation/update', {
      method: 'PATCH',
      body: JSON.stringify({
        conversationId: VALID_CONV_ID,
        title: 'Updated Title',
      }),
    });

    const response = await PATCH(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});
