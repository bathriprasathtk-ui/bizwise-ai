import cors from 'cors';
import express, { type Express } from 'express';
import { env } from './config';
import { ApiError } from './lib/errors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiRouter } from './routes';

const ALLOWED_METHODS = ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'];

function createCorsOptions(): cors.CorsOptions {
  return {
    origin(origin, callback) {
      // Same-origin and server-to-server calls have no Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }
      if (env.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new ApiError(403, 'ORIGIN_NOT_ALLOWED', 'This origin is not allowed to call the API.'));
    },
    methods: ALLOWED_METHODS,
    allowedHeaders: ['Authorization', 'Content-Type'],
    maxAge: 86_400,
  };
}

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    next();
  });

  app.use(cors(createCorsOptions()));
  app.use(express.json({ limit: '32kb' }));

  // Mounted twice so the API answers on /api/* (always) and on bare paths such as
  // /health, which Vercel also exposes at the root of the backend project.
  app.use('/api', apiRouter);
  app.use('/', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();

export default app;
