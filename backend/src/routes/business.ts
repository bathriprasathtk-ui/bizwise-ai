import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/asyncHandler';
import { ApiError, validationError } from '../lib/errors';
import { moneySchema, parseWith, uuidSchema } from '../lib/validate';
import { requireAuth } from '../middleware/auth';
import { generateInsights } from '../services/ai';
import { buildFinancialContext } from '../services/context';
import * as data from '../services/dataService';
import { summarizeEntries } from '../services/finance';
import { env } from '../config';

export const businessRouter = Router();

businessRouter.use(requireAuth);

const entrySchema = z.object({
  periodLabel: z
    .string({ required_error: 'Period label is required.', invalid_type_error: 'Period label is required.' })
    .trim()
    .min(1, 'Period label is required.')
    .max(60, 'Keep the period label under 60 characters.'),
  revenue: moneySchema,
  cogs: moneySchema,
  operatingExpenses: moneySchema,
  cashOnHand: moneySchema,
  notes: z
    .string()
    .trim()
    .max(500, 'Notes must be 500 characters or fewer.')
    .optional()
    .nullable(),
});

const businessPatchSchema = z
  .object({
    name: z
      .string({ invalid_type_error: 'Business name is required.' })
      .trim()
      .min(1, 'Business name is required.')
      .max(120, 'Keep the business name under 120 characters.')
      .optional(),
    currency: z
      .string({ invalid_type_error: 'Choose a currency.' })
      .trim()
      .regex(/^[A-Za-z]{3}$/, 'Use a three-letter currency code such as USD.')
      .transform((value) => value.toUpperCase())
      .optional(),
  })
  .refine((value) => value.name !== undefined || value.currency !== undefined, {
    message: 'Nothing to update.',
  });

businessRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');

    const business = await data.ensureBusiness(userId);
    const entries = await data.listEntries(business.id, userId);

    res.json({ business, entries, summary: summarizeEntries(entries) });
  }),
);

businessRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');

    const payload = parseWith(businessPatchSchema, req.body);
    const business = await data.ensureBusiness(userId);
    const updated = await data.updateBusiness(business.id, userId, payload);

    res.json({ business: updated });
  }),
);

businessRouter.post(
  '/entries',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');

    const payload = parseWith(entrySchema, req.body);
    const business = await data.ensureBusiness(userId);

    const entry = await data.createEntry(business.id, userId, {
      periodLabel: payload.periodLabel,
      revenue: payload.revenue,
      cogs: payload.cogs,
      operatingExpenses: payload.operatingExpenses,
      cashOnHand: payload.cashOnHand,
      notes: payload.notes ?? null,
    });

    const entries = await data.listEntries(business.id, userId);
    res.status(201).json({ entry, summary: summarizeEntries(entries) });
  }),
);

businessRouter.patch(
  '/entries/:id',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');

    const entryId = parseWith(uuidSchema, req.params.id);
    const payload = parseWith(entrySchema.partial(), req.body);
    if (Object.keys(payload).length === 0) {
      throw validationError([{ field: 'body', message: 'Nothing to update.' }]);
    }

    const business = await data.ensureBusiness(userId);
    const entry = await data.updateEntry(entryId, business.id, userId, payload);
    const entries = await data.listEntries(business.id, userId);

    res.json({ entry, summary: summarizeEntries(entries) });
  }),
);

businessRouter.delete(
  '/entries/:id',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');

    const entryId = parseWith(uuidSchema, req.params.id);
    const business = await data.ensureBusiness(userId);

    await data.deleteEntry(entryId, business.id, userId);
    const entries = await data.listEntries(business.id, userId);

    res.json({ success: true, summary: summarizeEntries(entries) });
  }),
);

businessRouter.post(
  '/insights',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');

    const business = await data.ensureBusiness(userId);
    const entries = await data.listEntries(business.id, userId);

    if (entries.length === 0) {
      throw new ApiError(
        409,
        'NO_FINANCIAL_DATA',
        'Add a financial entry first so the insights are grounded in your numbers.',
      );
    }

    const summary = summarizeEntries(entries);
    const context = buildFinancialContext(business, entries, summary);
    const insights = await generateInsights(context);

    res.json({
      insights,
      generatedAt: new Date().toISOString(),
      provider: env.aiProvider,
      model: env.aiModel,
    });
  }),
);
