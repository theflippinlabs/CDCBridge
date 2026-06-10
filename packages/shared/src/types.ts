import type { AuditAction, BatchStatus, ChainId, NftStatus } from './constants.js';

/** A user profile row. Mirrors `public.profiles`. */
export interface Profile {
  id: string; // matches auth.users.id
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

/** A saved destination wallet. Mirrors `public.wallets`. Addresses only — never keys. */
export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  chain: ChainId;
  address: string;
  notes: string | null;
  is_default: boolean;
  /** User attests they sent a test transfer to this address before bulk use. */
  tested: boolean;
  created_at: string;
  updated_at: string;
}

export type WalletInput = Pick<Wallet, 'name' | 'chain' | 'address'> &
  Partial<Pick<Wallet, 'notes' | 'is_default' | 'tested'>>;

/** An NFT tracked for withdrawal. Mirrors `public.nfts`. */
export interface Nft {
  id: string;
  user_id: string;
  collection_name: string;
  nft_name: string;
  edition_number: string | null;
  token_id: string | null;
  chain: ChainId;
  marketplace_source: string | null;
  current_status: NftStatus;
  image_url: string | null;
  crypto_com_nft_url: string | null;
  destination_wallet_id: string | null;
  withdrawal_tx_hash: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type NftInput = Pick<Nft, 'collection_name' | 'nft_name'> &
  Partial<
    Pick<
      Nft,
      | 'edition_number'
      | 'token_id'
      | 'chain'
      | 'marketplace_source'
      | 'current_status'
      | 'image_url'
      | 'crypto_com_nft_url'
      | 'destination_wallet_id'
      | 'withdrawal_tx_hash'
      | 'notes'
    >
  >;

/** A withdrawal batch groups NFTs under one destination wallet. */
export interface WithdrawalBatch {
  id: string;
  user_id: string;
  name: string;
  destination_wallet_id: string | null;
  status: BatchStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Join row linking a batch to an NFT, with per-step checklist state. */
export interface WithdrawalBatchItem {
  id: string;
  batch_id: string;
  nft_id: string;
  user_id: string;
  /** Per-step boolean map keyed by WithdrawalStepKey. */
  steps: Record<string, boolean>;
  position: number;
  created_at: string;
  updated_at: string;
}

/** Batch item joined with its NFT (returned by GET /api/batches/:id). */
export interface WithdrawalBatchItemWithNft extends WithdrawalBatchItem {
  nft: Nft;
}

export interface WithdrawalBatchDetail extends WithdrawalBatch {
  destination_wallet: Wallet | null;
  items: WithdrawalBatchItemWithNft[];
}

/** Append-only audit log entry. Mirrors `public.audit_logs`. */
export interface AuditLog {
  id: string;
  user_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/** Standard API error envelope. */
export interface ApiError {
  error: string;
  details?: unknown;
}

/** Result of validating a CSV row during import. */
export interface CsvRowResult {
  rowNumber: number;
  valid: boolean;
  errors: string[];
  data?: NftInput;
}

export interface CsvParseResult {
  rows: CsvRowResult[];
  validCount: number;
  invalidCount: number;
}
