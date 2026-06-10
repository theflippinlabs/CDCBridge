/**
 * Shared constants for VaultBridge.
 * These are intentionally framework-agnostic so both the Express backend
 * and the React frontend can consume them.
 */

/** Lifecycle status for a single NFT moving from Crypto.com → Onchain Wallet. */
export const NFT_STATUSES = [
  'stored_on_crypto_com',
  'queued_for_withdrawal',
  'withdrawal_started',
  'waiting_email_confirmation',
  'waiting_2fa',
  'submitted',
  'pending_onchain',
  'completed',
  'failed',
  'cancelled',
] as const;

export type NftStatus = (typeof NFT_STATUSES)[number];

/** Human-friendly labels for each status. */
export const NFT_STATUS_LABELS: Record<NftStatus, string> = {
  stored_on_crypto_com: 'Stored on Crypto.com',
  queued_for_withdrawal: 'Queued for withdrawal',
  withdrawal_started: 'Withdrawal started',
  waiting_email_confirmation: 'Waiting on email code',
  waiting_2fa: 'Waiting on 2FA',
  submitted: 'Submitted',
  pending_onchain: 'Pending onchain',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

/** Statuses that count as "done" for progress calculations. */
export const TERMINAL_STATUSES: NftStatus[] = ['completed', 'failed', 'cancelled'];

/** Ordered manual checklist steps the user performs per NFT during withdrawal. */
export const WITHDRAWAL_STEPS = [
  { key: 'open_nft_page', label: 'Open Crypto.com NFT page' },
  { key: 'click_withdraw', label: 'Click withdraw' },
  { key: 'paste_wallet', label: 'Paste destination wallet address' },
  { key: 'confirm_email', label: 'Confirm email code' },
  { key: 'confirm_2fa', label: 'Confirm 2FA' },
  { key: 'submit', label: 'Submit withdrawal' },
  { key: 'add_tx_hash', label: 'Add transaction hash' },
  { key: 'mark_completed', label: 'Mark as completed' },
] as const;

export type WithdrawalStepKey = (typeof WITHDRAWAL_STEPS)[number]['key'];

/** Supported chains. Cronos is the default Crypto.com Onchain Wallet network. */
export const CHAINS = [
  { id: 'cronos', label: 'Cronos / Crypto.com Onchain Wallet', explorer: 'https://explorer.cronos.org' },
  { id: 'ethereum', label: 'Ethereum', explorer: 'https://etherscan.io' },
  { id: 'polygon', label: 'Polygon', explorer: 'https://polygonscan.com' },
] as const;

export type ChainId = (typeof CHAINS)[number]['id'];

export const DEFAULT_CHAIN: ChainId = 'cronos';

/** Batch-level status derived from its items. */
export const BATCH_STATUSES = ['draft', 'in_progress', 'completed', 'cancelled'] as const;
export type BatchStatus = (typeof BATCH_STATUSES)[number];

/** Audit log action types. Append-only by policy. */
export const AUDIT_ACTIONS = [
  'wallet_created',
  'wallet_updated',
  'wallet_deleted',
  'wallet_assigned',
  'nft_imported',
  'nft_created',
  'nft_updated',
  'nft_deleted',
  'batch_created',
  'batch_updated',
  'status_changed',
  'tx_hash_added',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** Required CSV header columns (in any order) for NFT import. */
export const CSV_COLUMNS = [
  'collection_name',
  'nft_name',
  'edition_number',
  'token_id',
  'chain',
  'crypto_com_nft_url',
  'image_url',
  'notes',
] as const;

export type CsvColumn = (typeof CSV_COLUMNS)[number];

/** Columns that must be present and non-empty for a CSV row to be valid. */
export const CSV_REQUIRED_COLUMNS: CsvColumn[] = ['collection_name', 'nft_name'];
