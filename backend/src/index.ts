import { app } from './app';
import { env, reportConfigStatus } from './config';

reportConfigStatus();

const server = app.listen(env.port, () => {
  console.log(`[api] BizWise AI API listening on http://localhost:${env.port}`);
  console.log(`[api] Allowed origins: ${env.corsOrigins.join(', ') || '(none)'}`);
});

function shutdown(signal: string): void {
  console.log(`[api] ${signal} received, closing server.`);
  server.close(() => process.exit(0));
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
