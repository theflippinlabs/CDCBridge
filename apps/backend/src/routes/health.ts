import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'vaultbridge-backend',
    version: 'cors-reflect-v4',
    time: new Date().toISOString(),
  });
});
