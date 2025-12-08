import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/drizzle';
import { conversations } from '@/db/schema';
import type { ConversationAPI, ErrorResponse } from '@/types/api';

export const POST = async (): Promise<Response> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ErrorResponse = { error: 'Unauthorized' };
      return Response.json(errorResponse, { status: 401 });
    }

    const [row] = await db.insert(conversations).values({ userId }).returning();

    const response: ConversationAPI.StartResponse = { conversationId: row.id };
    return Response.json(response);
  } catch (error) {
    console.error('Error creating conversation:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    return Response.json(errorResponse, { status: 500 });
  }
};
