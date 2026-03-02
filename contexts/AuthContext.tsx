import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch the public users row for an auth user.
   * If no row exists yet, auto-create one so the user isn't stuck.
   */
  const fetchOrCreateProfile = async (authUser: {
    id: string;
    email?: string;
  }): Promise<User | null> => {
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existing) return existing as User;

    // No public profile yet — create one from auth data
    const username = authUser.email?.split('@')[0] ?? 'user';
    const { error: insertError } = await supabase.from('users').insert({
      id: authUser.id,
      username,
      display_name: username,
    });

    if (insertError) {
      console.error('Failed to create user profile:', insertError.message);
      return null;
    }

    const { data: created } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    return (created as User) ?? null;
  };

  useEffect(() => {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      console.warn('Supabase not configured — skipping auth init');
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (data.session?.user) {
          const profile = await fetchOrCreateProfile(data.session.user);
          if (profile) setUser(profile);
        }
      } catch (error) {
        console.error('Auth session error:', error);
      } finally {
        setIsLoading(false);
      }
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          if (session?.user) {
            const profile = await fetchOrCreateProfile(session.user);
            if (profile) setUser(profile);
          } else {
            setUser(null);
          }
        })();
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    setIsLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned');

      // Create user profile row with chosen username
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        username,
        display_name: username,
      });

      if (userError) throw userError;

      const profile = await fetchOrCreateProfile(authData.user);
      if (profile) {
        setUser(profile);
      } else {
        throw new Error('Failed to load user profile after sign up');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned');

      const profile = await fetchOrCreateProfile(data.user);
      if (profile) {
        setUser(profile);
      } else {
        throw new Error('Failed to load user profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    const profile = await fetchOrCreateProfile({ id: user.id, email: undefined });
    if (profile) setUser(profile);
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isSignedIn: !!user, signUp, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
