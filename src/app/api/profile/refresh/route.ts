import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/drizzle';
import { userMemory } from '@/db/schema';
import { eq } from 'drizzle-orm';
import {
  getUserMemory,
  createUserMemory,
  extractFactsFromMessage,
  mergeFactsIntoMemory,
  getUnprocessedMessages,
  UserFact,
} from '@/lib/memory';
import type { ProfileAPI, ErrorResponse } from '@/types/api';

/**
 * Manually triggers a full profile rebuild from all user messages
 * Useful for testing or if memory gets corrupted
 */
export const POST = async (): Promise<Response> => {
  try {
    const { userId } = await auth();
    if (!userId) {
      const errorResponse: ErrorResponse = { error: 'Unauthorized' };
      return Response.json(errorResponse, { status: 401 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      const errorResponse: ErrorResponse = {
        error: 'Groq API key not configured',
      };
      return Response.json(errorResponse, { status: 500 });
    }

    // Get or create user memory
    let memory = await getUserMemory(userId);
    if (!memory) {
      memory = await createUserMemory(userId);
    }

    // Fetch ONLY unprocessed user messages (incremental processing)
    // This skips messages we've already analyzed based on lastProcessedAt
    const unprocessedMessages = await getUnprocessedMessages(userId);

    if (unprocessedMessages.length === 0) {
      console.log(
        `[Profile Refresh] No unprocessed messages for user ${userId}`
      );
      const response: ProfileAPI.RefreshResponse = {
        profile: {
          ...memory,
          createdAt: memory.createdAt?.toISOString() ?? null,
          updatedAt: memory.updatedAt?.toISOString() ?? null,
        },
        factsAdded: 0,
      };
      return Response.json(response);
    }

    console.log(
      `[Profile Refresh] Processing ${unprocessedMessages.length} unprocessed messages for user ${userId}`
    );

    // Extract facts from unprocessed messages (in batches to avoid overwhelming the API)
    let allFacts: UserFact[] = [];
    const batchSize = 10; // Process 10 messages at a time

    for (let i = 0; i < unprocessedMessages.length; i += batchSize) {
      const batch = unprocessedMessages.slice(i, i + batchSize);
      const batchText = batch.map((m) => m.content).join('\n---\n');

      const facts = await extractFactsFromMessage(batchText, apiKey);
      allFacts = [...allFacts, ...facts];

      // Small delay to avoid rate limiting
      if (i + batchSize < unprocessedMessages.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Merge all facts into the existing memory
    const mergedFacts = await mergeFactsIntoMemory(
      memory.facts,
      allFacts,
      apiKey
    );

    // Get the timestamp of the last processed message
    const lastMessage = unprocessedMessages[unprocessedMessages.length - 1];
    const lastProcessedAt = lastMessage?.createdAt || new Date();

    // Update the database with new facts and last processed timestamp
    const result = await db
      .update(userMemory)
      .set({
        facts: mergedFacts,
        messageCount: memory.messageCount + unprocessedMessages.length,
        lastProcessedAt,
        updatedAt: new Date(),
      })
      .where(eq(userMemory.userId, userId))
      .returning();

    const updatedMemory = result[0];
    const factsAdded = Array.isArray(mergedFacts)
      ? mergedFacts.length - memory.facts.length
      : 0;

    const response: ProfileAPI.RefreshResponse = {
      profile: {
        ...updatedMemory,
        createdAt: updatedMemory.createdAt?.toISOString() ?? null,
        updatedAt: updatedMemory.updatedAt?.toISOString() ?? null,
      },
      factsAdded: Math.max(0, factsAdded),
    };

    return Response.json(response);
  } catch (error) {
    console.error('Error refreshing user profile:', error);
    const errorResponse: ErrorResponse = { error: 'Internal server error' };
    return Response.json(errorResponse, { status: 500 });
  }
};
