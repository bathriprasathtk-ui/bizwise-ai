import { Router } from 'express';
import { z } from 'zod';
import { ApiError } from '../lib/errors';
import { asyncHandler } from '../lib/asyncHandler';
import { parseWith } from '../lib/validate';
import { requireAuth } from '../middleware/auth';
import { generateAdvice } from '../services/ai';
import { buildFinancialContext } from '../services/context';
import * as data from '../services/dataService';
import { summarizeEntries } from '../services/finance';

export const aiRouter = Router();

aiRouter.use(requireAuth);

const chatSchema = z.object({
  message: z
    .string({ required_error: 'Write a question first.', invalid_type_error: 'Write a question first.' })
    .trim()
    .min(1, 'Write a question first.')
    .max(2000, 'Keep your question under 2000 characters.'),
});

aiRouter.get(
  '/chat',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');

    const business = await data.ensureBusiness(userId);
    const messages = await data.listChatMessages(business.id, userId, 60);

    res.json({ messages });
  }),
);

aiRouter.post(
  '/chat',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw new ApiError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');

    const payload = parseWith(chatSchema, req.body);
    const business = await data.ensureBusiness(userId);
    const entries = await data.listEntries(business.id, userId);

    if (entries.length === 0) {
      throw new ApiError(
        409,
        'NO_FINANCIAL_DATA',
        'Add a financial entry first so the advisor can ground its advice in your numbers.',
      );
    }

    const history = await data.listChatMessages(business.id, userId, 20);
    const summary = summarizeEntries(entries);
    const context = buildFinancialContext(business, entries, summary);

    const answer = await generateAdvice({
      context,
      question: payload.message,
      history,
    });

    const userMessage = await data.insertChatMessage(business.id, userId, 'user', payload.message);
    const assistantMessage = await data.insertChatMessage(business.id, userId, 'assistant', answer);

    res.status(201).json({ userMessage, assistantMessage });
  }),
);
