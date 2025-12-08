# AI Chatbot with Personality Profiling

A modern, full-stack AI chatbot application that learns from conversations and provides personality insights. Built with Next.js 15, TypeScript, and AI-powered by Groq.

## 🌟 Features

- **AI-Powered Chat**: Natural conversations using Groq's LLaMA 3.3 70B model
- **Personality Profiling**: Ask "Who am I?" or "Tell me about myself" to get AI-generated personality insights based on chat history
- **Conversation Memory**: Persistent storage of all conversations with automatic title generation
- **User Authentication**: Secure authentication using Clerk
- **Responsive Design**: Mobile-first design with drawer navigation on mobile and fixed sidebar on desktop
- **Modern UI**: Dark theme with OKLCH color space and minimalistic gradients
- **Real-time Updates**: React Query for optimistic updates and cache management
- **Markdown Support**: Rich message formatting with syntax highlighting for code blocks
- **Comprehensive Testing**: 116 tests across 16 test suites with high coverage

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS** with custom OKLCH color system
- **TanStack React Query** for state management
- **Shadcn UI** components

### Backend

- **Next.js API Routes**
- **Drizzle ORM** for database operations
- **PostgreSQL** (Neon serverless)
- **Clerk** for authentication
- **Groq SDK** for AI interactions

### Testing

- **Jest** with React Testing Library
- **100% coverage** for core components

## 📋 Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL database (Neon recommended for free tier)
- Clerk account (free tier available)
- Groq API key (free tier available)

## 🔑 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Groq AI
GROQ_API_KEY="gsk_..."
```

### Getting API Keys

1. **Database (Neon)**:

   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string

2. **Clerk Authentication**:

   - Sign up at [clerk.com](https://clerk.com)
   - Create a new application
   - Copy the publishable and secret keys from the API Keys section

3. **Groq AI**:
   - Sign up at [console.groq.com](https://console.groq.com)
   - Generate an API key from the dashboard

## 🚀 Installation & Setup

1. **Clone the repository**:

```bash
git clone <your-repo-url>
cd middleware-assignment
```

2. **Install dependencies**:

```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**:

   - Copy `.env.local.example` to `.env.local` (if exists)
   - Or create `.env.local` with the variables listed above

4. **Initialize the database**:

```bash
npm run db:push
```

5. **Run the development server**:

```bash
npm run dev
```

6. **Open the app**:
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Sign up or sign in using Clerk

## 📦 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Building
npm run build        # Build for production
npm start           # Start production server

# Database
npm run db:push      # Push schema changes to database
npm run db:studio    # Open Drizzle Studio (database GUI)
npm run db:generate  # Generate migrations

# Testing
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode

# Linting
npm run lint        # Run ESLint
```

## 🧪 Running Tests

The project includes comprehensive test coverage:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test chat-input
```

**Test Coverage**: 116 tests across 16 suites

- API Routes: Conversation and Messages endpoints
- React Components: UI components and layouts
- Hooks: Custom React Query hooks
- Utilities: Helper functions

## 📁 Project Structure

```
middleware-assignment/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (main)/            # Main layout group
│   │   │   ├── page.tsx       # Home page
│   │   │   ├── chat/[id]/     # Dynamic chat page
│   │   │   └── layout.tsx     # Sidebar layout
│   │   ├── api/               # API routes
│   │   │   ├── conversation/  # Conversation endpoints
│   │   │   └── messages/      # Message endpoints
│   │   ├── globals.css        # Global styles & theme
│   │   └── layout.tsx         # Root layout
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn UI components
│   │   ├── chat-input.tsx    # Message input
│   │   ├── chat-layout.tsx   # Chat container
│   │   ├── conversation-list.tsx
│   │   ├── message-list.tsx
│   │   ├── mobile-header.tsx
│   │   ├── mobile-sidebar.tsx
│   │   └── sidebar.tsx
│   ├── hooks/                # Custom React hooks
│   │   └── use-chat.ts       # Chat-related hooks
│   ├── lib/                  # Utility functions
│   │   └── utils.ts
│   ├── types/                # TypeScript types
│   │   └── api.ts            # API types & schemas
│   ├── db/                   # Database
│   │   ├── schema.ts         # Drizzle schema
│   │   └── drizzle.ts        # Database client
│   └── __tests__/            # Test files
│       ├── unit/
│       ├── fixtures/
│       └── helpers/
├── .env.local                # Environment variables
├── drizzle.config.ts         # Drizzle configuration
├── jest.config.ts            # Jest configuration
├── tailwind.config.ts        # Tailwind configuration
└── tsconfig.json             # TypeScript configuration
```

## 🎯 How It Works

### Personality Profiling

The chatbot analyzes your conversation history when you ask questions like:

- "Who am I?"
- "Tell me about myself"
- "What can you tell me about me?"
- "Describe my personality"

The AI:

1. Retrieves all messages from the current conversation
2. Analyzes patterns, interests, and communication style
3. Generates a comprehensive personality profile
4. Presents insights in an easy-to-read format

### Conversation Management

- **Auto-titling**: First message becomes the conversation title
- **Editable titles**: Click the edit icon to rename conversations
- **Persistent storage**: All messages saved to PostgreSQL
- **Optimistic updates**: Instant UI feedback with React Query

### Architecture

- **Type-safe API**: Zod schemas for request/response validation
- **Custom hooks**: Centralized data fetching logic
- **Component separation**: Modular, reusable components
- **Mobile-responsive**: Drawer navigation on mobile, sidebar on desktop

## 🎨 Design Features

- **Dark theme**: Always-on dark mode with muted colors
- **OKLCH colors**: Perceptually uniform color space
- **Gradient backgrounds**: Minimalistic gradients for depth
- **Syntax highlighting**: Code blocks with OneDark theme
- **Smooth animations**: Tailwind transitions and transforms

## 🔐 Authentication

The app uses Clerk for authentication:

- Email/password signup
- OAuth providers (Google, GitHub, etc.)
- Session management
- Protected API routes

## 📝 API Routes

### Conversations

- `POST /api/conversation/start` - Create new conversation
- `GET /api/conversation/list` - List all conversations
- `PATCH /api/conversation/update` - Update conversation title

### Messages

- `GET /api/messages/list?conversationId=<id>` - Get conversation messages
- `POST /api/messages/send` - Send message and get AI response

## 🚢 Deployment

The app is optimized for deployment on:

- **Vercel** (recommended for Next.js)
- **Railway**
- **Netlify**
- Any platform supporting Node.js

Make sure to set all environment variables in your deployment platform.

## 🧩 Future Enhancements

- Voice input/output
- Multi-language support
- Conversation export
- Message search
- Conversation sharing
- Advanced personality analytics
- Custom AI model selection

## 📄 License

MIT

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Built with ❤️ using Next.js and AI
