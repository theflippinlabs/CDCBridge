import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditAction } from '@vaultbridge/shared';

/**
 * Append an audit log entry. Best-effort: a failed audit write must never
 * break the primary operation, so errors are logged but not thrown.
 */
export async function writeAudit(
  db: SupabaseClient,
  userId: string,
  action: AuditAction,
  entityType: string,
  entityId: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { error } = await db.from('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? null,
  });
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[audit] failed to write log:', error.message);
  }
}
