import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import {
  signInWithPassword,
  signInAsGuest as supabaseSignInAsGuest,
  signOut as supabaseSignOut,
  getCurrentSession,
  onAuthStateChange,
} from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInAsGuest: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isGuest: false,
  error: null,

  // Call once on app mount (see App.tsx). Restores any existing session
  // from localStorage and subscribes to future auth changes (sign in,
  // sign out, token refresh) so the whole app stays in sync.
  initialize: async () => {
    const session = await getCurrentSession();
    set({
      session,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      isGuest: session?.user?.is_anonymous ?? false,
      isLoading: false,
    });

    onAuthStateChange((session, user) => {
      set({
        session,
        user,
        isAuthenticated: !!session,
        isGuest: user?.is_anonymous ?? false,
      });
    });
  },

  signIn: async (email: string, password: string) => {
    set({ error: null });
    const { session, user, error } = await signInWithPassword(email, password);

    if (error) {
      const message = error.message === 'Invalid login credentials'
        ? 'Incorrect email or password.'
        : error.message;
      set({ error: message });
      return { success: false, error: message };
    }

    set({ session, user, isAuthenticated: !!session, isGuest: user?.is_anonymous ?? false });
    return { success: true };
  },

  signInAsGuest: async () => {
    set({ error: null });
    const { session, user, error } = await supabaseSignInAsGuest();
    if (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
    set({ session, user, isAuthenticated: !!session, isGuest: true });
    return { success: true };
  },

  signOut: async () => {
    await supabaseSignOut();
    set({ session: null, user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));
