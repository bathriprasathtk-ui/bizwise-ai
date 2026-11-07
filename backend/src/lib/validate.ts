import { z } from 'zod';
import { validationError } from './errors';

/** Runs a zod schema and turns failures into a 400 with per-field messages. */
export function parseWith<Schema extends z.ZodTypeAny>(schema: Schema, data: unknown): z.infer<Schema> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));
    throw validationError(details);
  }
  return result.data;
}

function readAmount(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Money field: accepts numbers or numeric strings, rejects null/blank/negative values. */
export const moneySchema = z.unknown().transform((value, ctx) => {
  const parsed = readAmount(value);
  if (parsed === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid amount.' });
    return z.NEVER;
  }
  if (parsed < 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Amount cannot be negative.' });
    return z.NEVER;
  }
  if (parsed > 1_000_000_000_000) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Amount is too large.' });
    return z.NEVER;
  }
  return Math.round(parsed * 100) / 100;
});

/** Percentage change input, used by the simulator. */
export const percentChangeSchema = z.unknown().transform((value, ctx) => {
  const parsed = readAmount(value);
  if (parsed === null) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid percentage.' });
    return z.NEVER;
  }
  if (parsed < -100 || parsed > 300) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Percentage must be between -100% and 300%.' });
    return z.NEVER;
  }
  return Math.round(parsed * 10) / 10;
});

export const uuidSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, 'Invalid identifier.');
