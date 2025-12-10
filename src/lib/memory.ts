import { db } from '@/db/drizzle';
import { userMemory, messages } from '@/db/schema';
import { eq, desc, and, gt } from 'drizzle-orm';
import Groq from 'groq-sdk';

// Type for a single fact/insight about the user
export type UserFact = string;

// Type for the complete user memory profile
export interface UserMemoryProfile {
  id: string;
  userId: string;
  facts: UserFact[];
  messageCount: number;
  lastProcessedAt: Date | null;
  updatedAt: Date | null;
  createdAt: Date | null;
}

/**
 * Fetches the user's memory profile from the database
 */
export async function getUserMemory(
  userId: string
): Promise<UserMemoryProfile | null> {
  const result = await db
    .select()
    .from(userMemory)
    .where(eq(userMemory.userId, userId))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const memory = result[0];
  return {
    ...memory,
    facts: Array.isArray(memory.facts) ? memory.facts : [],
  };
}

/**
 * Creates an initial empty memory profile for a new user
 */
export async function createUserMemory(
  userId: string
): Promise<UserMemoryProfile> {
  const result = await db
    .insert(userMemory)
    .values({
      userId,
      facts: [],
      messageCount: 0,
    })
    .returning();

  const memory = result[0];
  return {
    ...memory,
    facts: Array.isArray(memory.facts) ? memory.facts : [],
  };
}

/**
 * Extracts factual information about the user from a conversation message
 * Uses LLM to analyze the message and extract personality-relevant facts
 */
export async function extractFactsFromMessage(
  userMessage: string,
  apiKey: string
): Promise<UserFact[]> {
  try {
    const client = new Groq({ apiKey });

    const prompt = `You are a fact extraction system. Analyze the user's message and extract ONLY factual or consistent personality-relevant information about the user.

Extract information about:
- Personal preferences (likes/dislikes)
- Hobbies and interests
- Professional background or skills
- Personal background (location, family, etc.)
- Communication style or personality traits
- Goals or aspirations
- Values or beliefs
- Emotional tendencies
- Specific facts they mention about themselves

CRITICAL RULES:
1. Extract ONLY facts that are clearly stated or strongly implied
2. Do NOT make assumptions or inferences beyond what's stated
3. Do NOT extract opinions about topics (extract that they HAVE those opinions)
4. Keep facts concise (one sentence each)
5. Return a JSON array of strings
6. If nothing relevant is found, return an empty array []

User message: "${userMessage.replace(/"/g, '\\"')}"

Return ONLY a valid JSON array of fact strings, nothing else.`;

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a fact extraction system. Always respond with valid JSON arrays only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent extraction
    });

    const content = response.choices[0]?.message?.content?.trim() ?? '[]';

    // Try to parse the JSON response
    try {
      const facts = JSON.parse(content);
      if (Array.isArray(facts)) {
        return facts.filter((f) => typeof f === 'string' && f.length > 0);
      }
      return [];
    } catch {
      console.error('Failed to parse fact extraction response:', content);
      return [];
    }
  } catch (error) {
    console.error('Error extracting facts from message:', error);
    return [];
  }
}

/**
 * Merges new facts into existing facts, removing duplicates and similar entries
 * Keeps the memory concise and under token limits
 */
export async function mergeFactsIntoMemory(
  existingFacts: UserFact[],
  newFacts: UserFact[],
  apiKey: string
): Promise<UserFact[]> {
  if (newFacts.length === 0) {
    return existingFacts;
  }

  if (existingFacts.length === 0) {
    return newFacts;
  }

  // If we have both, use LLM to intelligently merge and deduplicate
  try {
    const client = new Groq({ apiKey });

    const prompt = `You are a memory consolidation system. You will be given:
1. An existing list of facts about a user
2. A new list of facts about the same user

Your task:
- Merge the lists intelligently
- Remove exact duplicates
- Consolidate similar or overlapping facts into single, comprehensive facts
- Keep all unique information
- Prioritize newer, more specific information over older, vague information
- Keep the list concise (aim for under 50 facts total)
- Maintain chronological relevance (newer facts may update older ones)

Existing facts:
${JSON.stringify(existingFacts, null, 2)}

New facts:
${JSON.stringify(newFacts, null, 2)}

Return ONLY a valid JSON array of the merged facts. No explanation, just the array.`;

    const response = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a memory consolidation system. Always respond with valid JSON arrays only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content?.trim() ?? '[]';

    try {
      const mergedFacts = JSON.parse(content);
      if (Array.isArray(mergedFacts)) {
        // Limit to 50 facts to keep memory manageable
        return mergedFacts
          .filter((f) => typeof f === 'string' && f.length > 0)
          .slice(0, 50);
      }
    } catch {
      console.error('Failed to parse merged facts:', content);
    }
  } catch (error) {
    console.error('Error merging facts:', error);
  }

  // Fallback: simple concatenation with basic deduplication
  const combined = [...existingFacts, ...newFacts];
  const unique = Array.from(new Set(combined));
  return unique.slice(0, 50);
}

/**
 * Updates the user's memory profile with new facts from a conversation
 * This is the main function called after each user message
 *
 * @param messageTimestamp - Timestamp of the message being processed (for tracking)
 */
export async function updateUserMemory(
  userId: string,
  userMessage: string,
  apiKey: string,
  messageTimestamp?: Date | null
): Promise<UserMemoryProfile> {
  // Get or create user memory
  let memory = await getUserMemory(userId);
  if (!memory) {
    memory = await createUserMemory(userId);
  }

  // Check if this message was already processed (based on timestamp)
  if (messageTimestamp && memory.lastProcessedAt) {
    const msgTime =
      messageTimestamp instanceof Date
        ? messageTimestamp
        : new Date(messageTimestamp);
    const lastProcessed =
      memory.lastProcessedAt instanceof Date
        ? memory.lastProcessedAt
        : new Date(memory.lastProcessedAt);

    if (msgTime <= lastProcessed) {
      // Message already processed, skip
      console.log(
        `[Memory] Skipping already processed message for user ${userId}`
      );
      return memory;
    }
  }

  // Extract new facts from the message
  const newFacts = await extractFactsFromMessage(userMessage, apiKey);

  const now = new Date();
  const updateTimestamp = messageTimestamp || now;

  if (newFacts.length === 0) {
    // No new facts, just increment message count and update timestamp
    const result = await db
      .update(userMemory)
      .set({
        messageCount: memory.messageCount + 1,
        lastProcessedAt: updateTimestamp,
        updatedAt: now,
      })
      .where(eq(userMemory.userId, userId))
      .returning();

    return {
      ...result[0],
      facts: Array.isArray(result[0].facts) ? result[0].facts : [],
    };
  }

  // Merge new facts with existing facts
  const mergedFacts = await mergeFactsIntoMemory(
    memory.facts,
    newFacts,
    apiKey
  );

  // Update the database
  const result = await db
    .update(userMemory)
    .set({
      facts: mergedFacts,
      messageCount: memory.messageCount + 1,
      lastProcessedAt: updateTimestamp,
      updatedAt: now,
    })
    .where(eq(userMemory.userId, userId))
    .returning();

  return {
    ...result[0],
    facts: Array.isArray(result[0].facts) ? result[0].facts : [],
  };
}

/**
 * Formats the user's memory profile as a string for inclusion in system prompts
 */
export function formatMemoryForPrompt(
  memory: UserMemoryProfile | null
): string {
  if (!memory || memory.facts.length === 0) {
    return 'No prior information about the user is available yet.';
  }

  const factsList = memory.facts
    .map((fact, idx) => `${idx + 1}. ${fact}`)
    .join('\n');

  return `User Profile (learned from ${memory.messageCount} previous messages):
${factsList}`;
}

/**
 * Gets unprocessed user messages (messages created after lastProcessedAt)
 * Used for incremental memory updates
 */
export async function getUnprocessedMessages(
  userId: string,
  limit?: number
): Promise<Array<{ id: string; content: string; createdAt: Date | null }>> {
  const { conversations } = await import('@/db/schema');

  // Get user's memory to find last processed timestamp
  const memory = await getUserMemory(userId);

  const whereConditions = [
    eq(conversations.userId, userId),
    eq(messages.role, 'user'), // Only user messages
  ];

  // Add timestamp filter if we have a lastProcessedAt
  if (memory?.lastProcessedAt) {
    whereConditions.push(gt(messages.createdAt, memory.lastProcessedAt));
  }

  const query = db
    .select({
      id: messages.id,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(and(...whereConditions))
    .orderBy(messages.createdAt);

  if (limit) {
    return await query.limit(limit);
  }

  return await query;
}

/**
 * Gets recent messages from all user conversations (for additional context)
 * Limited to last N messages to avoid token bloat
 */
export async function getRecentCrossConversationMessages(
  userId: string,
  limit: number = 20
): Promise<Array<{ role: string; content: string }>> {
  const { conversations } = await import('@/db/schema');

  const recentMessages = await db
    .select({
      role: messages.role,
      content: messages.content,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .innerJoin(conversations, eq(messages.conversationId, conversations.id))
    .where(eq(conversations.userId, userId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);

  return recentMessages.reverse(); // Return in chronological order
}
