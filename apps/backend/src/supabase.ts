import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { config } from './config.js';

// @supabase/realtime-js requires a global WebSocket at client construction.
// Node < 22 has none, so provide one. (The backend never uses realtime, but
// the Supabase client still instantiates a realtime client internally.)
if (!(globalThis as { WebSocket?: unknown }).WebSocket) {
  (globalThis as { WebSocket?: unknown }).WebSocket = WebSocket;
}

/**
 * A client scoped to a specific user's access token.
 * Because we forward the user's JWT, PostgREST applies Row Level Security,
 * so every query is automatically constrained to that user's rows.
 */
export function userClient(accessToken: string): SupabaseClient {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Service-role client. Bypasses RLS — use only for trusted server operations
 * that cannot be expressed as the current user. Never expose this key.
 */
export const adminClient: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
