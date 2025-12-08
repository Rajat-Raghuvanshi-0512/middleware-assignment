import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { messages, conversations } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { z } from "zod";

const querySchema = z.object({
  conversationId: z.string().uuid(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
});

export const GET = async (req: Request) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const params = querySchema.parse({
      conversationId: searchParams.get("conversationId"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    // Verify conversation ownership
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, params.conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    const limit = params.limit ?? 50;
    const page = params.page ?? 1;
    const offset = (page - 1) * limit;

    const data = await db.query.messages.findMany({
      where: eq(messages.conversationId, params.conversationId),
      orderBy: (msg, { asc }) => [asc(msg.createdAt)],
      limit,
      offset,
    });

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: count() })
      .from(messages)
      .where(eq(messages.conversationId, params.conversationId));

    const total = totalResult?.count ?? 0;

    return Response.json({
      messages: data,
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + data.length < total,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request parameters", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error listing messages:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};
