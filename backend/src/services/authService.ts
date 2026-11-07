import { ApiError } from '../lib/errors';
import { getAdminClient } from './supabase';

interface SupabaseAuthError {
  message?: string;
  status?: number;
}

/**
 * Verifies a Supabase access token with the Auth server and returns the user.
 * Never trusts a client supplied user id.
 */
export async function verifyAccessToken(token: string): Promise<{ id: string; email: string }> {
  const supabase = getAdminClient();
  let data;
  try {
    const result = await supabase.auth.getUser(token);
    if (result.error) {
      const authError = result.error as SupabaseAuthError;
      if (authError.status === 429) {
        throw new ApiError(429, 'TOO_MANY_REQUESTS', 'Too many requests. Please wait a moment and try again.');
      }
      throw new ApiError(401, 'INVALID_TOKEN', 'Your session has expired. Please sign in again.');
    }
    data = result.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, 'AUTH_UNAVAILABLE', 'We could not verify your session. Please try again.');
  }

  if (!data.user) {
    throw new ApiError(401, 'INVALID_TOKEN', 'Your session has expired. Please sign in again.');
  }

  return { id: data.user.id, email: data.user.email ?? '' };
}

export function readBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue) return null;
  const [scheme, token] = headerValue.split(' ');
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== 'bearer') return null;
  return token.trim().length > 0 ? token.trim() : null;
}
