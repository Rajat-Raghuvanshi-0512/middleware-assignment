# Test Suite

This directory contains comprehensive unit tests for the application, organized in a dedicated test directory structure.

## Structure

```
src/__tests__/
├── setup.ts                 # Jest setup and global mocks
├── helpers/
│   ├── render.tsx           # Custom render with providers
│   └── mocks.ts             # Shared mock utilities
├── fixtures/
│   ├── conversations.ts     # Test data for conversations
│   └── messages.ts          # Test data for messages
└── unit/
    ├── lib/
    │   └── utils.test.ts    # Utility function tests
    ├── hooks/
    │   └── use-chat.test.ts # Custom hook tests
    ├── components/
    │   ├── chat-input.test.tsx
    │   ├── chat-layout.test.tsx
    │   ├── conversation-list.test.tsx
    │   ├── markdown-renderer.test.tsx
    │   ├── message-list.test.tsx
    │   └── ui/
    │       └── button.test.tsx
    └── api/
        ├── conversation/
        │   ├── start/route.test.ts
        │   ├── list/route.test.ts
        │   └── update/route.test.ts
        └── messages/
            ├── send/route.test.ts
            └── list/route.test.ts
```

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test -- --coverage
```

## Test Coverage

The test suite covers:

- **Utilities**: Class name merging (`cn` function)
- **Hooks**: Custom React hooks (`useMessages`, `useSendMessage`)
- **Components**: All React components with user interactions, loading states, and error handling
- **API Routes**: All API endpoints with authentication, validation, and error scenarios

## Test Utilities

### Custom Render

The `helpers/render.tsx` provides a custom render function that wraps components with necessary providers (QueryClient, ClerkProvider).

```typescript
import { render } from '../helpers/render';

render(<MyComponent />);
```

### Fixtures

Test data fixtures are available in the `fixtures/` directory for consistent test data across tests.

```typescript
import { mockConversations } from '../../fixtures/conversations';
import { mockMessages } from '../../fixtures/messages';
```

## Writing New Tests

1. Create test files following the naming convention: `*.test.ts` or `*.test.tsx`
2. Place tests in the corresponding directory structure under `unit/`
3. Use the custom `render` helper for component tests
4. Use fixtures for test data
5. Mock external dependencies (Clerk, database, API calls)

## Mocking

- **Clerk**: Mocked in `setup.ts` with default test user
- **Database**: Mocked using Jest mocks in individual test files
- **Fetch API**: Mocked globally in `setup.ts`
- **Next.js Router**: Mocked in `setup.ts`

