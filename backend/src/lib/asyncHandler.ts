import type { NextFunction, Request, RequestHandler, Response } from 'express';

type MaybeAsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown> | unknown;

/**
 * Express 4 does not forward rejected promises to the error handler on its own.
 * Every route handler is wrapped so a thrown ApiError becomes a clean JSON response.
 */
export function asyncHandler(handler: MaybeAsyncHandler): RequestHandler {
  return (req, res, next) => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
}
