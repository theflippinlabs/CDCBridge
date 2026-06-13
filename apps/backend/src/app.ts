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

  // CORS. Auth is enforced by bearer tokens (not cookies), so we can safely
  // reflect any origin unless an explicit allow-list is configured. We also
  // register an explicit preflight handler so OPTIONS requests always get the
  // proper headers before hitting the auth middleware.
  const allowAllOrigins = config.corsOrigins.length === 0 || config.corsOrigins.includes('*');
  const corsOptions = {
    origin: allowAllOrigins ? true : config.corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
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
