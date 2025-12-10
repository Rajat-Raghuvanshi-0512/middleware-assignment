import { z } from 'zod';
import type { conversations, messages, userMemory } from '@/db/schema';

// Database entity types
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type NewMessage = typeof messages.$inferInsert;
export type UserMemory = typeof userMemory.$inferSelect;
export type NewUserMemory = typeof userMemory.$inferInsert;

// API response types (dates are serialized as strings in JSON, but can be null from DB)
export type ConversationResponse = Omit<Conversation, 'createdAt'> & {
  createdAt: string | Date | null;
};
export type MessageResponse = Omit<Message, 'createdAt'> & {
  createdAt: string | Date | null;
};
export type UserMemoryResponse = Omit<UserMemory, 'createdAt' | 'updatedAt'> & {
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
};

// API Request/Response Types

// Conversation API Types
export namespace ConversationAPI {
  // POST /api/conversation/start
  export type StartRequest = void;
  export type StartResponse = {
    conversationId: string;
  };

  // GET /api/conversation/list
  export type ListRequest = void;
  export type ListResponse = {
    conversations: ConversationResponse[];
  };

  // PATCH /api/conversation/update
  export const UpdateRequestSchema = z.object({
    conversationId: z.string().uuid(),
    title: z.string().min(1).max(255),
  });
  export type UpdateRequest = z.infer<typeof UpdateRequestSchema>;
  export type UpdateResponse = {
    conversation: ConversationResponse;
  };
}

// Messages API Types
export namespace MessagesAPI {
  // GET /api/messages/list
  export const ListRequestSchema = z.object({
    conversationId: z.string().uuid(),
  });
  export type ListRequest = z.infer<typeof ListRequestSchema>;
  export type ListResponse = {
    messages: MessageResponse[];
  };

  // POST /api/messages/send
  export const SendRequestSchema = z.object({
    conversationId: z.string().uuid(),
    content: z.string().min(1).max(10000),
  });
  export type SendRequest = z.infer<typeof SendRequestSchema>;
  export type SendResponse = {
    reply: string;
  };
}

// Profile/Memory API Types
export namespace ProfileAPI {
  // GET /api/profile/get
  export type GetRequest = void;
  export type GetResponse = {
    profile: UserMemoryResponse | null;
  };

  // POST /api/profile/refresh - manually trigger profile rebuild from all messages
  export type RefreshRequest = void;
  export type RefreshResponse = {
    profile: UserMemoryResponse;
    factsAdded: number;
  };
}

// Error Response Type
export type ErrorResponse = {
  error: string;
  details?: unknown;
};

// API Response wrapper
export type APIResponse<T> = T | ErrorResponse;
