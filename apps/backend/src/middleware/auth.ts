import type { NextFunction, Request, Response } from 'express';
import { userClient } from '../supabase.js';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Request augmented with the authenticated user context. */
export interface AuthedRequest extends Request {
  userId: string;
  accessToken: string;
  db: SupabaseClient;
}

/**
 * Read the `sub` (user id) from a JWT payload WITHOUT verifying the signature.
 * Verification is intentionally delegated to PostgREST: every query runs through
 * `userClient(token)`, which forwards the token to Supabase where the signature,
 * expiry, and Row Level Security are all enforced. A forged or expired token
 * therefore cannot read or write any data — it simply fails at the database.
 * This keeps auth working without depending on the service-role key.
 */
function decodeUserId(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return typeof payload.sub === 'string' && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}

/**
 * Attaches `userId`, `accessToken`, and an RLS-scoped `db` client to the request.
 * The token is fully validated downstream by Supabase/PostgREST on every query.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    return;
  }
  const token = header.slice('Bearer '.length).trim();

  const userId = decodeUserId(token);
  if (!userId) {
    res.status(401).json({ error: 'Invalid or expired token.' });
    return;
  }

  const authed = req as AuthedRequest;
  authed.userId = userId;
  authed.accessToken = token;
  authed.db = userClient(token);
  next();
}
