import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/drizzle';
import { conversations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { ConversationAPI } from '@/types/api';
import type { ErrorResponse } from '@/types/api';

const bodySchema = ConversationAPI.UpdateRequestSchema;

export const PATCH = async (req: Request): Promise<Response> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ErrorResponse = { error: 'Unauthorized' };
      return Response.json(errorResponse, { status: 401 });
    }

    const body: ConversationAPI.UpdateRequest = bodySchema.parse(
      await req.json()
    );

    // Verify conversation ownership
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, body.conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      const errorResponse: ErrorResponse = {
        error: 'Conversation not found or access denied',
      };
      return Response.json(errorResponse, { status: 404 });
    }

    // Update conversation title
    const [updated] = await db
      .update(conversations)
      .set({ title: body.title })
      .where(eq(conversations.id, body.conversationId))
      .returning();

    const response: ConversationAPI.UpdateResponse = { conversation: updated };
    return Response.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid request data',
        details: error.issues,
      };
      return Response.json(errorResponse, { status: 400 });
    }

    console.error('Error updating conversation:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    return Response.json(errorResponse, { status: 500 });
  }
};
