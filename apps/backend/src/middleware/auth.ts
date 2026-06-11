import type { NextFunction, Request, Response } from 'express';
import { adminClient, userClient } from '../supabase.js';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Request augmented with the authenticated user context. */
export interface AuthedRequest extends Request {
  userId: string;
  accessToken: string;
  db: SupabaseClient;
}

/**
 * Validates the Supabase access token by asking Supabase to resolve the user.
 * This works regardless of the project's JWT signing method (legacy HS256 or
 * the newer asymmetric signing keys) and needs no shared JWT secret.
 * On success it attaches `userId`, `accessToken`, and an RLS-scoped `db` client.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();

  try {
    const { data, error } = await adminClient.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: 'Invalid or expired token.' });
      return;
    }
    const authed = req as AuthedRequest;
    authed.userId = data.user.id;
    authed.accessToken = token;
    authed.db = userClient(token);
    next();
  } catch {
    res.status(401).json({ error: 'Could not verify token.' });
  }
}
