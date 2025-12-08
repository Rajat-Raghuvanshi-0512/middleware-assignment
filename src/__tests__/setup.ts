import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      pathname: '/',
      query: {},
      asPath: '/',
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    useAuth: jest.fn(() => ({
      userId: 'test-user-id',
      isLoaded: true,
      isSignedIn: true,
    })),
    auth: jest.fn(() => ({
      userId: 'test-user-id',
    })),
    ClerkProvider: jest.fn(({ children }) => children),
    UserButton: jest.fn(() =>
      React.createElement('div', { 'data-testid': 'user-button' }, 'UserButton')
    ),
  };
});

// Mock environment variables
process.env.GROQ_API_KEY = 'test-groq-api-key';
process.env.DATABASE_URL = 'postgresql://localhost:5432/testdb';

// Mock fetch globally
global.fetch = jest.fn();

// Mock matchMedia for drawer component
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollIntoView for DOM elements
HTMLElement.prototype.scrollIntoView = jest.fn();

// Polyfill Request and Response for Node.js environment (Next.js API routes use these)
if (typeof Request === 'undefined') {
  global.Request = class Request {
    url: string;
    method: string;
    headers: Headers;
    body: string | null;
    bodyUsed: boolean = false;
    constructor(input: string | Request, init?: RequestInit) {
      // Ensure URL is always a string
      if (typeof input === 'string') {
        this.url = input;
      } else if (input instanceof Request) {
        this.url = input.url;
      } else {
        this.url = String(input);
      }
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      // Store body as-is (should be a string from JSON.stringify)
      // Handle body - convert to string if needed
      if (init?.body === undefined || init?.body === null) {
        this.body = null;
      } else if (typeof init.body === 'string') {
        this.body = init.body;
      } else {
        // For other types (FormData, Blob, etc.), convert to string
        this.body = String(init.body);
      }
    }
    async json() {
      if (this.bodyUsed) {
        throw new Error('Body already used');
      }
      this.bodyUsed = true;
      if (typeof this.body === 'string') {
        try {
          // Parse the JSON string
          return this.body.trim() ? JSON.parse(this.body) : {};
        } catch {
          // If parsing fails, throw to match real Request behavior
          throw new Error('Failed to parse JSON');
        }
      }
      // If body is already an object, return it
      return this.body || {};
    }
    async text() {
      if (this.bodyUsed) {
        throw new Error('Body already used');
      }
      this.bodyUsed = true;
      return typeof this.body === 'string'
        ? this.body
        : JSON.stringify(this.body || '');
    }
  } as unknown as typeof Request;
}

if (typeof Response === 'undefined') {
  class MockResponse {
    status: number;
    statusText: string;
    headers: Headers;
    body: unknown;
    ok: boolean;
    constructor(body?: BodyInit | null, init?: ResponseInit) {
      this.status = init?.status || 200;
      this.statusText = init?.statusText || 'OK';
      this.headers = new Headers(init?.headers);
      this.body = body ?? null;
      this.ok = this.status >= 200 && this.status < 300;
    }
    async json() {
      return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
    }
    async text() {
      return typeof this.body === 'string'
        ? this.body
        : JSON.stringify(this.body);
    }
    static json(data: unknown, init?: ResponseInit) {
      return new MockResponse(JSON.stringify(data), {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...init?.headers,
        },
      });
    }
    static error() {
      return new MockResponse(null, { status: 500 });
    }
    static redirect(url: string | URL, status?: number) {
      return new MockResponse(null, { status: status || 302 });
    }
  }
  global.Response = MockResponse as unknown as typeof Response;
}

// Suppress console errors in tests (optional - remove if you want to see them)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    const firstArg = args[0];
    // Convert all args to string for checking, handling Error objects
    const errorString = args
      .map((arg) => {
        if (arg instanceof Error) {
          return arg.message;
        }
        return String(arg);
      })
      .join(' ');

    // Suppress React warnings
    if (
      typeof firstArg === 'string' &&
      (firstArg.includes('Warning: ReactDOM.render') ||
        firstArg.includes('Not implemented: HTMLFormElement.prototype.submit'))
    ) {
      return;
    }

    // Suppress expected test errors (intentional database errors in tests)
    // These are from tests that intentionally trigger errors to test error handling
    if (errorString.includes('DB Error')) {
      return;
    }

    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
