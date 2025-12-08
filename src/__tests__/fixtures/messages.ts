export const mockMessages = [
  {
    id: '660e8400-e29b-41d4-a716-446655440000',
    conversationId: '550e8400-e29b-41d4-a716-446655440000',
    role: 'user',
    content: 'Hello, how are you?',
    createdAt: new Date('2024-01-01T00:00:00Z'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440001',
    conversationId: '550e8400-e29b-41d4-a716-446655440000',
    role: 'assistant',
    content: 'I am doing well, thank you! How can I help you today?',
    createdAt: new Date('2024-01-01T00:00:01Z'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440002',
    conversationId: '550e8400-e29b-41d4-a716-446655440000',
    role: 'user',
    content: 'Can you explain React hooks?',
    createdAt: new Date('2024-01-01T00:00:02Z'),
  },
  {
    id: '660e8400-e29b-41d4-a716-446655440003',
    conversationId: '550e8400-e29b-41d4-a716-446655440000',
    role: 'assistant',
    content:
      'React hooks are functions that let you use state and other React features in functional components.',
    createdAt: new Date('2024-01-01T00:00:03Z'),
  },
];

export const mockMessage = mockMessages[0];
