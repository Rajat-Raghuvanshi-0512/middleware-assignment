// Mock dependencies BEFORE imports
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/db/drizzle', () => ({
  db: {
    select: jest.fn(),
  },
}));

import { GET } from '@/app/api/conversation/list/route';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/drizzle';
import { mockConversations } from '../../../../fixtures/conversations';
import type { ConversationResponse } from '@/types/api';

const mockAuth = auth as jest.MockedFunction<typeof auth>;

type MockDb = {
  select: jest.MockedFunction<() => {
    from: jest.MockedFunction<
      (table: unknown) => {
        where: jest.MockedFunction<
          (condition: unknown) => {
            orderBy: jest.MockedFunction<() => Promise<ConversationResponse[]>>;
          }
        >;
      }
    >;
  }>;
};

const mockDb = db as unknown as MockDb;

describe('GET /api/conversation/list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return conversations for authenticated user', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);

    const mockOrderBy = jest
      .fn<Promise<ConversationResponse[]>, []>()
      .mockResolvedValue(mockConversations);
    const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    mockDb.select.mockReturnValue({ from: mockFrom });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    // Dates are serialized to strings in JSON responses
    expect(data.conversations).toHaveLength(mockConversations.length);
    expect(data.conversations[0].id).toBe(mockConversations[0].id);
    expect(data.conversations[0].title).toBe(mockConversations[0].title);
    expect(mockDb.select).toHaveBeenCalled();
  });

  it('should return 401 for unauthenticated user', async () => {
    mockAuth.mockResolvedValue({ userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(mockDb.select).not.toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);

    const mockOrderBy = jest
      .fn<Promise<ConversationResponse[]>, []>()
      .mockRejectedValue(new Error('DB Error'));
    const mockWhere = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    mockDb.select.mockReturnValue({ from: mockFrom });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});
