import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ApiError } from '../lib/errors';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'That endpoint does not exist.' },
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (res.headersSent) return;

  if (error instanceof ApiError) {
    res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  const isJsonParseError = error instanceof SyntaxError && 'body' in error;
  if (isJsonParseError) {
    res.status(400).json({
      error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON.' },
    });
    return;
  }

  const isTooLarge = typeof error === 'object' && error !== null && (error as { type?: string }).type === 'entity.too.large';
  if (isTooLarge) {
    res.status(413).json({
      error: { code: 'PAYLOAD_TOO_LARGE', message: 'That request is too large.' },
    });
    return;
  }

  // Log the failure class only. Never log request bodies, headers or secrets.
  const name = error instanceof Error ? error.name : 'UnknownError';
  console.error(`[api] unhandled error (${name})`);

  res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on our end. Please try again.' },
  });
};
