import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull(), // Clerk userId
    title: varchar('title', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    userIdIdx: index('conversations_user_id_idx').on(table.userId),
    createdAtIdx: index('conversations_created_at_idx').on(table.createdAt),
  })
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id')
      .references(() => conversations.id, { onDelete: 'cascade' })
      .notNull(),
    role: varchar('role', { length: 20 }).notNull(),
    content: varchar('content', { length: 10000 }).notNull(), // Increased from 5000
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    conversationIdIdx: index('messages_conversation_id_idx').on(
      table.conversationId
    ),
    createdAtIdx: index('messages_created_at_idx').on(table.createdAt),
  })
);

// User memory/personality profile - learned from all conversations
export const userMemory = pgTable(
  'user_memory',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: varchar('user_id', { length: 255 }).notNull().unique(), // Clerk userId - one profile per user
    facts: jsonb('facts').notNull().default('[]'), // Array of learned facts about the user
    messageCount: integer('message_count').notNull().default(0), // Total messages analyzed
    lastProcessedAt: timestamp('last_processed_at'), // Timestamp of last processed message (null = never processed)
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('user_memory_user_id_idx').on(table.userId),
    updatedAtIdx: index('user_memory_updated_at_idx').on(table.updatedAt),
  })
);
