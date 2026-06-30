import { createClient, type Session, type User } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Check your .env.local file.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ─── Auth helpers ──────────────────────────────────────────
// Thin wrappers used by authStore so the store itself stays
// framework-agnostic and easy to test.

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { session: data.session, user: data.user, error };
}

export async function signInAsGuest() {
  const { data, error } = await supabase.auth.signInAnonymously();
  return { session: data.session, user: data.user, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export function onAuthStateChange(
  callback: (session: Session | null, user: User | null) => void,
) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session, session?.user ?? null);
  });
  return data.subscription;
}
