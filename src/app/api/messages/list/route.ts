import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { messages, conversations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { MessagesAPI } from "@/types/api";
import type { ErrorResponse } from "@/types/api";

const querySchema = MessagesAPI.ListRequestSchema;

export const GET = async (req: Request): Promise<Response> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ErrorResponse = { error: "Unauthorized" };
      return Response.json(errorResponse, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const params: MessagesAPI.ListRequest = querySchema.parse({
      conversationId: searchParams.get("conversationId"),
    });

    // Verify conversation ownership
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, params.conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      const errorResponse: ErrorResponse = {
        error: "Conversation not found or access denied",
      };
      return Response.json(errorResponse, { status: 404 });
    }

    const data = await db.query.messages.findMany({
      where: eq(messages.conversationId, params.conversationId),
      orderBy: (msg, { asc }) => [asc(msg.createdAt)],
    });

    const response: MessagesAPI.ListResponse = {
      messages: data,
    };
    return Response.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ErrorResponse = {
        error: "Invalid request parameters",
        details: error.issues,
      };
      return Response.json(errorResponse, { status: 400 });
    }

    console.error("Error listing messages:", error);
    const errorResponse: ErrorResponse = { error: "Internal server error" };
    return Response.json(errorResponse, { status: 500 });
  }
};
