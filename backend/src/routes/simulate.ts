import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/errors';
import { asyncHandler } from '../lib/asyncHandler';
import { parseWith, percentChangeSchema, uuidSchema } from '../lib/validate';
import { requireAuth } from '../middleware/auth';
import * as data from '../services/dataService';
import { runSimulation } from '../services/finance';

export const simulateRouter = Router();

simulateRouter.use(requireAuth);

const simulateSchema = z.object({
  priceChange: percentChangeSchema,
  volumeChange: percentChangeSchema,
  costChange: percentChangeSchema,
  opexChange: percentChangeSchema,
  targetProfit: z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((value, ctx) => {
      if (value === undefined || value === null) return null;
      const parsed = typeof value === 'string' ? Number(value.trim()) : value;
      if (!Number.isFinite(parsed)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid target profit.' });
        return z.NEVER;
      }
      if (parsed < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Target profit cannot be negative.' });
        return z.NEVER;
      }
      return Math.round(parsed * 100) / 100;
    }),
  name: z.string().trim().max(80, 'Keep the scenario name under 80 characters.').optional(),
  save: z.boolean().optional(),
});

simulateRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');

    const payload = parseWith(simulateSchema, req.body);
    const business = await data.ensureBusiness(userId);
    const entries = await data.listEntries(business.id, userId);
    const latest = entries[entries.length - 1];

    if (!latest) {
      throw new ApiError(
        409,
        'NO_FINANCIAL_DATA',
        'Add a financial entry before running a simulation.',
      );
    }

    const inputs = {
      priceChange: payload.priceChange,
      volumeChange: payload.volumeChange,
      costChange: payload.costChange,
      opexChange: payload.opexChange,
      targetProfit: payload.targetProfit,
    };

    const result = runSimulation(latest, inputs, business.currency);

    let scenario = null;
    if (payload.save) {
      const name = (payload.name ?? '').trim();
      if (name.length === 0) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'Give the scenario a name before saving it.', [
          { field: 'name', message: 'Scenario name is required.' },
        ]);
      }
      scenario = await data.createScenario(business.id, userId, name, inputs, result);
    }

    res.json({ result, scenario, currency: business.currency });
  }),
);

simulateRouter.get(
  '/history',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');

    const business = await data.ensureBusiness(userId);
    const scenarios = await data.listScenarios(business.id, userId);

    res.json({ scenarios, currency: business.currency });
  }),
);

simulateRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');

    const scenarioId = parseWith(uuidSchema, req.params.id);
    const business = await data.ensureBusiness(userId);

    await data.deleteScenario(scenarioId, business.id, userId);
    const scenarios = await data.listScenarios(business.id, userId);

    res.json({ success: true, scenarios });
  }),
);
