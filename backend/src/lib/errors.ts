export interface FieldIssue {
  field: string;
  message: string;
}

/**
 * Error type that carries an HTTP status and a stable machine-readable code.
 * Messages are written for humans and never include secrets or raw database output.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: FieldIssue[];

  constructor(status: number, code: string, message: string, details?: FieldIssue[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    if (details && details.length > 0) this.details = details;
  }
}

export function validationError(details: FieldIssue[], message = 'Some fields need attention.'): ApiError {
  return new ApiError(400, 'VALIDATION_ERROR', details[0]?.message ?? message, details);
}

export function databaseUnavailable(): ApiError {
  return new ApiError(
    503,
    'DATABASE_UNAVAILABLE',
    'The database is not configured on this deployment. Add the Supabase server credentials.',
  );
}

export function databaseError(): ApiError {
  return new ApiError(500, 'DATABASE_ERROR', 'We could not save your data right now. Please try again.');
}

export function notFound(message = 'We could not find that item.'): ApiError {
  return new ApiError(404, 'NOT_FOUND', message);
}
