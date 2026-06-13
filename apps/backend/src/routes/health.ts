import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'vaultbridge-backend',
    version: 'cors-open-v3',
    time: new Date().toISOString(),
  });
});
