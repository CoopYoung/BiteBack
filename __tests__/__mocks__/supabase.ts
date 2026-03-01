/**
 * Mock Supabase client for testing.
 * Each method returns a chainable builder that resolves to { data, error }.
 * Tests can override responses via mockResolvedValue on individual methods.
 */

type MockResponse = { data: unknown; error: null } | { data: null; error: { message: string } };

function createQueryBuilder(defaultResponse: MockResponse = { data: [], error: null }) {
  const builder: Record<string, jest.Mock> = {};

  const chainMethods = [
    'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'in', 'is', 'filter', 'not', 'or', 'and',
    'order', 'limit', 'range', 'single', 'maybeSingle',
    'csv', 'count',
  ];

  // Every chain method returns the builder itself
  for (const method of chainMethods) {
    builder[method] = jest.fn().mockReturnValue(builder);
  }

  // The builder is also a thenable that resolves to the default response
  builder.then = jest.fn((resolve: (val: MockResponse) => void) => {
    resolve(defaultResponse);
    return builder;
  });

  // Allow overriding the final response
  builder._setResponse = jest.fn((response: MockResponse) => {
    builder.then = jest.fn((resolve: (val: MockResponse) => void) => {
      resolve(response);
      return builder;
    });
    // Also make single/maybeSingle resolve with the response
    builder.single.mockReturnValue({ ...builder, then: builder.then });
    builder.maybeSingle.mockReturnValue({ ...builder, then: builder.then });
  });

  // Make single() and maybeSingle() also resolve
  builder.single.mockImplementation(() => {
    return { ...builder, then: builder.then };
  });
  builder.maybeSingle.mockImplementation(() => {
    return { ...builder, then: builder.then };
  });

  return builder;
}

const mockAuth = {
  getSession: jest.fn().mockResolvedValue({
    data: { session: null },
    error: null,
  }),
  signUp: jest.fn().mockResolvedValue({
    data: { user: null },
    error: null,
  }),
  signInWithPassword: jest.fn().mockResolvedValue({
    data: { user: null, session: null },
    error: null,
  }),
  signOut: jest.fn().mockResolvedValue({ error: null }),
  onAuthStateChange: jest.fn().mockReturnValue({
    data: {
      subscription: { unsubscribe: jest.fn() },
    },
  }),
};

const mockStorage = {
  from: jest.fn().mockReturnValue({
    upload: jest.fn().mockResolvedValue({ error: null }),
    getPublicUrl: jest.fn().mockReturnValue({
      data: { publicUrl: 'https://example.com/test-image.jpg' },
    }),
    remove: jest.fn().mockResolvedValue({ error: null }),
  }),
};

const mockChannel = {
  on: jest.fn().mockReturnThis(),
  subscribe: jest.fn().mockReturnThis(),
};

export const mockSupabase = {
  auth: mockAuth,
  storage: mockStorage,
  from: jest.fn().mockImplementation(() => createQueryBuilder()),
  channel: jest.fn().mockReturnValue(mockChannel),
  removeChannel: jest.fn(),
};

// Reset all mocks between tests
export function resetSupabaseMocks() {
  mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mockAuth.signUp.mockResolvedValue({ data: { user: null }, error: null });
  mockAuth.signInWithPassword.mockResolvedValue({ data: { user: null, session: null }, error: null });
  mockAuth.signOut.mockResolvedValue({ error: null });
  mockSupabase.from.mockImplementation(() => createQueryBuilder());
}

export { createQueryBuilder };
