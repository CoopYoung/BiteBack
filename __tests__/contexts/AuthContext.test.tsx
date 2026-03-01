import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';

// Mock expo modules
jest.mock('expo-router', () => ({
  useRouter: jest.fn().mockReturnValue({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  default: { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() },
}));

// Mock supabase before importing AuthContext
const mockGetSession = jest.fn().mockResolvedValue({
  data: { session: null },
  error: null,
});
const mockOnAuthStateChange = jest.fn().mockReturnValue({
  data: { subscription: { unsubscribe: jest.fn() } },
});
const mockSignUp = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue({ error: null });
const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnValue({
    eq: jest.fn().mockReturnValue({
      maybeSingle: jest.fn().mockResolvedValue({ data: null }),
    }),
  }),
  insert: jest.fn().mockResolvedValue({ error: null }),
});

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signUp: mockSignUp,
      signInWithPassword: mockSignInWithPassword,
      signOut: mockSignOut,
    },
    from: mockFrom,
  },
}));

// Set env var so auth init doesn't skip
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    mockSignOut.mockResolvedValue({ error: null });
  });

  it('starts loading then resolves to signed out', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('throws when used outside AuthProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within AuthProvider');

    spy.mockRestore();
  });

  it('signOut clears user and calls supabase', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
  });

  it('signIn calls signInWithPassword', async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'u1' }, session: {} },
      error: null,
    });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: { id: 'u1', username: 'test', display_name: 'Test' },
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.signIn('test@test.com', 'password123');
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
    });
  });
});
