import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../lib/errors';
import { readBearerToken, verifyAccessToken } from '../services/authService';

/**
 * Protects a route with a Supabase access token. The verified user id is attached to
 * the request; handlers must scope every query with it.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = readBearerToken(req.header('authorization'));
    if (!token) {
      throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');
    }
    req.user = await verifyAccessToken(token);
    next();
  } catch (error) {
    next(error);
  }
}
