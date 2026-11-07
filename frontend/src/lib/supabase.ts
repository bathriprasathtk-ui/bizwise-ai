import { createClient } from '@supabase/supabase-js';

const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

/** Only the anon/publishable key ever reaches the browser. */
export const isSupabaseConfigured = url.length > 0 && anonKey.length > 0;

export const supabase = createClient(
  url.length > 0 ? url : 'https://placeholder.supabase.co',
  anonKey.length > 0 ? anonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export function requireConfiguration(): string | null {
  if (!isSupabaseConfigured) {
    return 'This app is missing its Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then rebuild.';
  }
  return null;
}
