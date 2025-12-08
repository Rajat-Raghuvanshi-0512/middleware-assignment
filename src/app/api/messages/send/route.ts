import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/drizzle";
import { messages, conversations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import Groq from "groq-sdk";
import { z } from "zod";

const bodySchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(10000),
});

export const POST = async (req: Request) => {
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

    // 1. Save user message
    await db.insert(messages).values({
      role: "user",
      content: body.content,
      conversationId: body.conversationId,
    });

    // 2. Fetch full conversation history
    const history = await db.query.messages.findMany({
      where: eq(messages.conversationId, body.conversationId),
      orderBy: (msg, { asc }) => [asc(msg.createdAt)],
    });

    // 3. Convert to Groq format
    const groqMessages = history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // 4. Get API key and create client
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Groq API key not configured" },
        { status: 500 }
      );
    }

    const client = new Groq({ apiKey });

    const chat = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: groqMessages,
    });

    const reply = chat.choices[0]?.message?.content ?? "";

    if (!reply) {
      return Response.json(
        { error: "Failed to generate response" },
        { status: 500 }
      );
    }

    // 5. Save AI reply
    await db.insert(messages).values({
      role: "assistant",
      content: reply,
      conversationId: body.conversationId,
    });

    // 6. Update conversation title if it's the first user message
    if (history.length === 1 && !conversation.title) {
      const title = body.content.slice(0, 50).trim();
      await db
        .update(conversations)
        .set({ title })
        .where(eq(conversations.id, body.conversationId));
    }

    return Response.json({ reply });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error sending message:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
};
