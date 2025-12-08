import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { conversations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  title: z.string().min(1).max(255),
});

export const PATCH = async (req: Request) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = bodySchema.parse(await req.json());

    // Verify conversation ownership
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, body.conversationId),
        eq(conversations.userId, userId)
      ),
    });

    if (!conversation) {
      return Response.json(
        { error: "Conversation not found or access denied" },
        { status: 404 }
      );
    }

    // Update conversation title
    const [updated] = await db
      .update(conversations)
      .set({ title: body.title })
      .where(eq(conversations.id, body.conversationId))
      .returning();

    return Response.json({ conversation: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating conversation:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};
