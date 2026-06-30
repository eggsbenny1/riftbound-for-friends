import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import {
  signInWithPassword,
  signOut as supabaseSignOut,
  getCurrentSession,
  onAuthStateChange,
} from '@/lib/supabase';

type AuthState = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;        // true until the initial session check completes
  isAuthenticated: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
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
      isLoading: false,
    });

    onAuthStateChange((session, user) => {
      set({
        session,
        user,
        isAuthenticated: !!session,
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

    set({ session, user, isAuthenticated: !!session });
    return { success: true };
  },

  signOut: async () => {
    await supabaseSignOut();
    set({ session: null, user: null, isAuthenticated: false });
  },

  clearError: () => set({ error: null }),
}));
