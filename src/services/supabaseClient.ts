import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anonymous Key is missing from environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type AuthError = {
  message: string;
};

export type SessionData = {
  user: {
    id: string;
    email?: string;
  } | null;
  session: unknown;
};