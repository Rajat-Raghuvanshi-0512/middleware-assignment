export const mockConversations = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: 'test-user-id',
    title: 'Test Conversation 1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: 'test-user-id',
    title: 'Test Conversation 2',
    createdAt: new Date('2024-01-02T00:00:00Z'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    userId: 'test-user-id',
    title: null,
    createdAt: new Date('2024-01-03T00:00:00Z'),
  },
];

export const mockConversation = mockConversations[0];
