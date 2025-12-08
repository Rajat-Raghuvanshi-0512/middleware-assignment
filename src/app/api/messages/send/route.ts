import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/drizzle';
import { messages, conversations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import Groq from 'groq-sdk';
import { z } from 'zod';
import { MessagesAPI } from '@/types/api';
import type { ErrorResponse } from '@/types/api';

const bodySchema = MessagesAPI.SendRequestSchema;

export const POST = async (req: Request): Promise<Response> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ErrorResponse = { error: 'Unauthorized' };
      return Response.json(errorResponse, { status: 401 });
    }

    const body: MessagesAPI.SendRequest = bodySchema.parse(await req.json());

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

    // 1. Save user message
    await db.insert(messages).values({
      role: 'user',
      content: body.content,
      conversationId: body.conversationId,
    });

    // 2. Fetch full conversation history
    const history = await db.query.messages.findMany({
      where: eq(messages.conversationId, body.conversationId),
      orderBy: (msg, { asc }) => [asc(msg.createdAt)],
    });

    // 3. Convert to Groq format
    type GroqMessage = { role: 'user' | 'assistant'; content: string };
    const groqMessages: GroqMessage[] = history.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // 4. Get API key and create client
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      const errorResponse: ErrorResponse = {
        error: 'Groq API key not configured',
      };
      return Response.json(errorResponse, { status: 500 });
    }

    const client = new Groq({ apiKey });

    const chat = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: groqMessages,
    });

    const reply = chat.choices[0]?.message?.content ?? '';

    if (!reply) {
      const errorResponse: ErrorResponse = {
        error: 'Failed to generate response',
      };
      return Response.json(errorResponse, { status: 500 });
    }

    // 5. Save AI reply
    await db.insert(messages).values({
      role: 'assistant',
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

    const response: MessagesAPI.SendResponse = { reply };
    return Response.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ErrorResponse = {
        error: 'Invalid request data',
        details: error.issues,
      };
      return Response.json(errorResponse, { status: 400 });
    }

    console.error('Error sending message:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    return Response.json(errorResponse, { status: 500 });
  }
};
