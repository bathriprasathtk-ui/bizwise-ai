import 'dotenv/config';

function readString(name: string, fallback = ''): string {
  const value = process.env[name];
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

const corsOrigin = readString('CORS_ORIGIN', 'http://localhost:5173');

export const env = {
  nodeEnv: readString('NODE_ENV', 'development'),
  port: Number.parseInt(readString('PORT', '8787'), 10) || 8787,
  supabaseUrl: readString('SUPABASE_URL'),
  supabaseServiceRoleKey: readString('SUPABASE_SERVICE_ROLE_KEY'),
  aiProvider: readString('AI_PROVIDER', 'gemini').toLowerCase(),
  aiApiKey: readString('AI_API_KEY'),
  aiModel: readString('AI_MODEL', 'gemini-2.5-flash'),
  corsOrigins: corsOrigin
    .split(',')
    .map((value) => value.trim().replace(/\/+$/, ''))
    .filter((value) => value.length > 0),
} as const;

export function isSupabaseConfigured(): boolean {
  return env.supabaseUrl.length > 0 && env.supabaseServiceRoleKey.length > 0;
}

/** Startup warning only — never prints secret values. */
export function reportConfigStatus(): void {
  if (!isSupabaseConfigured()) {
    console.warn(
      '[config] SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY are missing. Protected routes will return 503 until they are set.',
    );
  }
  if (!env.aiApiKey) {
    console.warn('[config] AI_API_KEY is missing. Advisor requests will return 503 until it is set.');
  }
}
