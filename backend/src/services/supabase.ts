import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '../config';
import { databaseUnavailable } from '../lib/errors';

let adminClient: SupabaseClient | null = null;

/**
 * Server-side Supabase client. Uses the service role key, which never leaves the backend.
 * Every query in this codebase still filters by the verified user id (defence in depth on
 * top of row level security).
 */
export function getAdminClient(): SupabaseClient {
  if (!isSupabaseConfigured()) throw databaseUnavailable();
  if (!adminClient) {
    adminClient = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: { 'X-Client-Info': 'bizwise-ai-api' },
      },
    });
  }
  return adminClient;
}
