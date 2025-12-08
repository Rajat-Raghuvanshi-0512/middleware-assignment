import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/drizzle';
import { conversations } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { ConversationAPI, ErrorResponse } from '@/types/api';

export const GET = async (): Promise<Response> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ErrorResponse = { error: 'Unauthorized' };
      return Response.json(errorResponse, { status: 401 });
    }

    const data = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.createdAt));

    const response: ConversationAPI.ListResponse = {
      conversations: data,
    };
    return Response.json(response);
  } catch (error) {
    console.error('Error listing conversations:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    return Response.json(errorResponse, { status: 500 });
  }
};
