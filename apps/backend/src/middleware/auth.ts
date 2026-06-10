import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { userClient } from '../supabase.js';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Request augmented with the authenticated user context. */
export interface AuthedRequest extends Request {
  userId: string;
  accessToken: string;
  db: SupabaseClient;
}

interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  role?: string;
}

/**
 * Verifies the Supabase access token (HS256, signed with the project's JWT
 * secret) and attaches `userId`, `accessToken`, and an RLS-scoped `db` client.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, config.supabaseJwtSecret) as SupabaseJwtPayload;
    if (!payload.sub) {
      res.status(401).json({ error: 'Invalid token: no subject.' });
      return;
    }
    const authed = req as AuthedRequest;
    authed.userId = payload.sub;
    authed.accessToken = token;
    authed.db = userClient(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
