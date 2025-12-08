// Mock implementations for common dependencies

export const mockFetch = (global.fetch as jest.Mock) || jest.fn();

export const mockClerkAuth = {
  userId: 'test-user-id',
  isLoaded: true,
  isSignedIn: true,
  sessionId: 'test-session-id',
};

export const resetMocks = () => {
  mockFetch.mockClear();
};

