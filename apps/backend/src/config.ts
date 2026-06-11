import dotenv from 'dotenv';

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    // Fail fast and loud — a misconfigured backend is worse than a crash.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

/**
 * Tolerate common copy/paste mistakes in the Supabase URL (missing protocol,
 * trailing slash or whitespace) so a tiny typo doesn't crash the whole backend.
 */
function normalizeUrl(raw: string): string {
  let u = raw.trim().replace(/\s+/g, '').replace(/\/+$/, '');
  if (u && !/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  supabaseUrl: normalizeUrl(required('SUPABASE_URL')),
  supabaseAnonKey: required('SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};
