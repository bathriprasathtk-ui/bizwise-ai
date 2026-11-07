/**
 * Vercel serverless entry point.
 *
 * The Express app is created in ../src/app.ts and mounted on every path, so /health,
 * /api/health and every /api/* route are served by this single function.
 */
import app from '../src/app';

export default app;
