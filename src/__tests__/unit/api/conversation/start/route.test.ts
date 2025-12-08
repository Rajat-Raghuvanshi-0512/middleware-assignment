// Mock dependencies BEFORE imports
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}));

jest.mock('@/db/drizzle', () => ({
  db: {
    insert: jest.fn(),
  },
}));

import { POST } from '@/app/api/conversation/start/route';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/drizzle';
import type { ConversationResponse } from '@/types/api';

const mockAuth = auth as jest.MockedFunction<typeof auth>;

type MockDb = {
  insert: jest.MockedFunction<
    (table: unknown) => {
      values: jest.MockedFunction<
        (values: { userId: string }) => {
          returning: jest.MockedFunction<() => Promise<[ConversationResponse]>>;
        }
      >;
    }
  >;
};

const mockDb = db as unknown as MockDb;

describe('POST /api/conversation/start', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new conversation for authenticated user', async () => {
    const newConvId = '550e8400-e29b-41d4-a716-446655440010';
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);

    const mockReturning = jest
      .fn<Promise<[ConversationResponse]>, []>()
      .mockResolvedValue([
        {
          id: newConvId,
          userId: 'test-user-id',
          title: null,
          createdAt: null,
        },
      ]);
    const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
    mockDb.insert.mockReturnValue({ values: mockValues });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ conversationId: newConvId });
    expect(mockDb.insert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith({ userId: 'test-user-id' });
  });

  it('should return 401 for unauthenticated user', async () => {
    mockAuth.mockResolvedValue({ userId: null } as Awaited<
      ReturnType<typeof auth>
    >);

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: 'Unauthorized' });
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('should handle database errors', async () => {
    mockAuth.mockResolvedValue({ userId: 'test-user-id' } as Awaited<
      ReturnType<typeof auth>
    >);

    const mockReturning = jest
      .fn<Promise<[ConversationResponse]>, []>()
      .mockRejectedValue(new Error('DB Error'));
    const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
    mockDb.insert.mockReturnValue({ values: mockValues });

    const response = await POST();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal server error' });
  });
});
