import { UserMemoryProfile, formatMemoryForPrompt } from './memory';

/**
 * Detects if the user is asking about themselves
 * Common patterns: "Who am I?", "Tell me about myself", "What do you know about me?"
 */
export function isAskingAboutSelf(message: string): boolean {
  const lowerMessage = message.toLowerCase().trim();
  
  const patterns = [
    /^who am i\??$/i,
    /^what do you know about me\??$/i,
    /^tell me about myself\??$/i,
    /^describe me\??$/i,
    /^what can you tell me about me\??$/i,
    /^how would you describe me\??$/i,
    /^what have you learned about me\??$/i,
    /^what do you remember about me\??$/i,
    /who am i\?/i,
    /tell me about myself/i,
    /describe me/i,
  ];

  return patterns.some(pattern => pattern.test(lowerMessage));
}

/**
 * Builds the system prompt for normal conversation
 * Includes user memory context so the AI is aware of the user's personality
 */
export function buildConversationSystemPrompt(memory: UserMemoryProfile | null): string {
  const memoryContext = formatMemoryForPrompt(memory);

  return `You are a helpful, friendly AI assistant engaged in a conversation with a user.

${memoryContext}

IMPORTANT INSTRUCTIONS:
1. Use the user profile above to personalize your responses and show that you understand who they are
2. Reference relevant facts from their profile naturally when appropriate
3. Continue learning about the user through your conversation
4. Be conversational, warm, and engaging
5. If asked about what you know about the user (e.g., "Who am I?"), provide a thoughtful summary based ONLY on the profile above
6. Do NOT invent or assume information that is not in the user profile
7. If the profile is empty, let the user know you're still learning about them

Remember: You are having an ongoing relationship with this user. Use the profile to make the conversation more personal and meaningful.`;
}

/**
 * Builds the system prompt specifically for "Who am I?" questions
 * Enforces strict adherence to stored facts only
 */
export function buildProfileResponsePrompt(memory: UserMemoryProfile | null): string {
  const memoryContext = formatMemoryForPrompt(memory);

  if (!memory || memory.facts.length === 0) {
    return `The user is asking about themselves, but you haven't learned anything about them yet.

Respond warmly and let them know:
- You're just getting to know them
- You'll learn more about them as you chat
- Encourage them to share more about themselves

Be friendly and inviting, not apologetic.`;
  }

  return `The user is asking you to describe them or tell them what you know about them.

${memoryContext}

CRITICAL INSTRUCTIONS:
1. Create a thoughtful, warm personality profile based ONLY on the facts listed above
2. Do NOT invent, assume, or add any information that is not explicitly in the profile
3. Organize the information into a coherent narrative (e.g., interests, background, preferences, personality)
4. Use a warm, conversational tone
5. Show that you genuinely know and appreciate them as an individual
6. If certain areas are sparse, acknowledge that you're still learning about those aspects

Your goal: Make the user feel understood and recognized, using ONLY the verified facts you have learned.`;
}

/**
 * Builds the complete message array for Groq API
 * Includes system prompt with memory context
 */
export function buildMessagesWithMemory(
  conversationHistory: Array<{ role: string; content: string }>,
  memory: UserMemoryProfile | null,
  userMessage: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const isProfileQuestion = isAskingAboutSelf(userMessage);
  
  const systemPrompt = isProfileQuestion
    ? buildProfileResponsePrompt(memory)
    : buildConversationSystemPrompt(memory);

  // Build the messages array
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    {
      role: 'system',
      content: systemPrompt,
    },
  ];

  // Add conversation history (excluding the current message since it's already in history)
  for (const msg of conversationHistory) {
    if (msg.role === 'user' || msg.role === 'assistant') {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }
  }

  return messages;
}

