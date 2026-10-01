import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';
import { setSubscriptionTier, type SubscriptionTier } from './paywall';
import type { UserProfile } from '../types';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateUsername: (username: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, subscription_tier')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      setProfile(null);
      return;
    }

    const typedProfile: UserProfile = {
      id: data.id,
      username: data.username,
      subscription_tier: data.subscription_tier ?? 'free',
    };
    setProfile(typedProfile);

    const tier = (typedProfile.subscription_tier || 'free') as SubscriptionTier;
    setSubscriptionTier(tier);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfile(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        (async () => {
          await loadProfile(newSession.user.id);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'Invalid email or password. Please try again.' };
      }
      return { error: error.message };
    }
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string, username?: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'An account with this email already exists. Try signing in instead.' };
      }
      return { error: error.message };
    }

    if (data.user) {
      const cleanUsername = username?.trim() || null;
      if (cleanUsername) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username: cleanUsername,
            subscription_tier: 'free',
          });
        if (profileError && profileError.code === '23505') {
          return { error: 'That username is already taken. Please choose another.' };
        }
      } else {
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            subscription_tier: 'free',
          });
      }
    }

    return { error: null };
  }, []);

  const updateUsername = useCallback(async (username: string) => {
    if (!user) return { error: 'Not signed in' };
    const cleanUsername = username.trim();
    if (!cleanUsername) return { error: 'Username cannot be empty' };
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      return { error: 'Username can only contain letters, numbers, and underscores' };
    }
    if (cleanUsername.length < 3) {
      return { error: 'Username must be at least 3 characters' };
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ username: cleanUsername })
      .eq('id', user.id);

    if (updateError && updateError.code === '23505') {
      return { error: 'That username is already taken' };
    }
    if (updateError) {
      return { error: updateError.message };
    }

    await loadProfile(user.id);
    return { error: null };
  }, [user, loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signIn, signUp, signOut, updateUsername, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
