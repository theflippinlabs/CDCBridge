import { supabase } from './supabase';
import type {
  CsvParseResult,
  Nft,
  NftInput,
  Wallet,
  WalletInput,
  WithdrawalBatch,
  WithdrawalBatchDetail,
  WithdrawalBatchItemWithNft,
} from '@vaultbridge/shared';

// In production the frontend calls its own origin ("" => /api/...), and Vercel
// proxies /api/* to the backend (see vercel.json). This avoids cross-origin
// requests entirely, so there is no CORS to misconfigure. For local dev, set
// VITE_API_BASE_URL to the backend (e.g. http://localhost:4000).
function resolveApiBase(): string {
  const raw = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim().replace(/\/+$/, '');
  if (raw && raw.includes('localhost')) return raw;
  return '';
}

const BASE = resolveApiBase();

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(await authHeader()),
    ...((init.headers as Record<string, string>) ?? {}),
  };
  const res = await fetch(`${BASE}${path}`, { ...init, headers });

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (isJson && (payload as { error?: string }).error) || `Request failed (${res.status})`;
    throw new ApiRequestError(res.status, message, payload);
  }
  if (!isJson) {
    // A non-JSON 2xx response means we hit the wrong host (e.g. HTML from the
    // frontend). Fail loudly instead of returning HTML that crashes the UI.
    throw new ApiRequestError(res.status, 'Unexpected non-JSON response from the API.', payload);
  }
  return payload as T;
}

// ── NFTs ───────────────────────────────────────────────────────────────────
export const api = {
  listNfts: (params?: { status?: string; collection?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.collection) q.set('collection', params.collection);
    const qs = q.toString();
    return request<{ nfts: Nft[] }>(`/api/nfts${qs ? `?${qs}` : ''}`).then((r) => r.nfts);
  },
  createNft: (input: NftInput) =>
    request<{ nft: Nft }>('/api/nfts', { method: 'POST', body: JSON.stringify(input) }).then(
      (r) => r.nft,
    ),
  importCsv: (content: string) =>
    request<{ imported: number; result: CsvParseResult }>('/api/nfts/import-csv', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  updateNft: (id: string, patch: Partial<NftInput>) =>
    request<{ nft: Nft }>(`/api/nfts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then((r) => r.nft),
  deleteNft: (id: string) => request<void>(`/api/nfts/${id}`, { method: 'DELETE' }),

  // ── Wallets ───────────────────────────────────────────────────────────────
  listWallets: () => request<{ wallets: Wallet[] }>('/api/wallets').then((r) => r.wallets),
  createWallet: (input: WalletInput) =>
    request<{ wallet: Wallet }>('/api/wallets', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then((r) => r.wallet),
  updateWallet: (id: string, patch: Partial<WalletInput>) =>
    request<{ wallet: Wallet }>(`/api/wallets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then((r) => r.wallet),
  deleteWallet: (id: string) => request<void>(`/api/wallets/${id}`, { method: 'DELETE' }),

  // ── Batches ───────────────────────────────────────────────────────────────
  listBatches: () =>
    request<{ batches: (WithdrawalBatch & { items: { nft: { current_status: string } }[] })[] }>(
      '/api/batches',
    ).then((r) => r.batches),
  getBatch: (id: string) =>
    request<{ batch: WithdrawalBatchDetail }>(`/api/batches/${id}`).then((r) => r.batch),
  createBatch: (input: {
    name: string;
    destination_wallet_id?: string | null;
    nft_ids: string[];
    notes?: string | null;
  }) =>
    request<{ batch: WithdrawalBatch }>('/api/batches', {
      method: 'POST',
      body: JSON.stringify(input),
    }).then((r) => r.batch),
  updateBatch: (id: string, patch: { name?: string; status?: string; notes?: string | null }) =>
    request<{ batch: WithdrawalBatch }>(`/api/batches/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then((r) => r.batch),

  // ── Batch items ─────────────────────────────────────────────────────────
  updateBatchItem: (
    id: string,
    patch: { steps?: Record<string, boolean>; nft_status?: string; withdrawal_tx_hash?: string | null },
  ) =>
    request<{ item: WithdrawalBatchItemWithNft }>(`/api/batch-items/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }).then((r) => r.item),

  // ── Export ───────────────────────────────────────────────────────────────
  async exportBatchCsv(id: string): Promise<Blob> {
    const res = await fetch(`${BASE}/api/export/batch/${id}`, {
      method: 'POST',
      headers: { ...(await authHeader()) },
    });
    if (!res.ok) throw new ApiRequestError(res.status, 'Export failed');
    return res.blob();
  },
};
