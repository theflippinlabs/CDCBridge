import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/error.js';
import { healthRouter } from './routes/health.js';
import { walletsRouter } from './routes/wallets.js';
import { nftsRouter } from './routes/nfts.js';
import { batchesRouter } from './routes/batches.js';
import { batchItemsRouter } from './routes/batchItems.js';
import { exportRouter } from './routes/export.js';

export function createApp() {
  const app = express();

  // When CORS_ORIGINS is "*" (or unset), reflect any origin. Reflecting the
  // request origin — rather than the literal "*" — keeps it compatible with
  // credentialed requests. Otherwise, use the explicit allow-list.
  const allowAllOrigins = config.corsOrigins.length === 0 || config.corsOrigins.includes('*');
  app.use(
    cors({
      origin: allowAllOrigins ? true : config.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '5mb' }));

  // Public health check.
  app.use('/', healthRouter);

  // Everything under /api requires a valid Supabase access token.
  app.use('/api', requireAuth, walletsRouter);
  app.use('/api', requireAuth, nftsRouter);
  app.use('/api', requireAuth, batchesRouter);
  app.use('/api', requireAuth, batchItemsRouter);
  app.use('/api', requireAuth, exportRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Not found.' }));
  app.use(errorHandler);

  return app;
}
