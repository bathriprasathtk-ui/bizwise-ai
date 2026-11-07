import { Router } from 'express';
import { aiRouter } from './ai';
import { businessRouter } from './business';
import { simulateRouter } from './simulate';

export const apiRouter = Router();

// API responses are per-user and must never be cached by a proxy or browser.
apiRouter.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

apiRouter.get('/', (_req, res) => {
  res.json({
    service: 'bizwise-ai-api',
    status: 'ok',
    health: '/api/health',
  });
});

apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'bizwise-ai-api',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

apiRouter.use('/business', businessRouter);
apiRouter.use('/simulate', simulateRouter);
apiRouter.use('/ai', aiRouter);
