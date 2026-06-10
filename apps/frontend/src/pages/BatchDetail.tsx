import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  WITHDRAWAL_STEPS,
  explorerTxUrl,
  isValidTxHash,
  NFT_STATUSES,
  NFT_STATUS_LABELS,
  type NftStatus,
  type WithdrawalBatchDetail,
  type WithdrawalBatchItemWithNft,
} from '@vaultbridge/shared';
import { AppShell } from '../components/AppShell';
import { BatchProgress, countsFromStatuses } from '../components/BatchProgress';
import { StatusBadge } from '../components/StatusBadge';
import { CopyButton } from '../components/CopyButton';
import { AddressPreview } from '../components/AddressPreview';
import { SafetyNotice } from '../components/SafetyNotice';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

/** Which NFT status each completed step should drive the NFT into. */
const STEP_STATUS: Partial<Record<string, NftStatus>> = {
  open_nft_page: 'withdrawal_started',
  confirm_email: 'waiting_email_confirmation',
  confirm_2fa: 'waiting_2fa',
  submit: 'submitted',
  add_tx_hash: 'pending_onchain',
  mark_completed: 'completed',
};

export function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [batch, setBatch] = useState<WithdrawalBatchDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      setBatch(await api.getBatch(id));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load batch.', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => countsFromStatuses(batch?.items.map((i) => i.nft.current_status) ?? []),
    [batch],
  );

  function patchItemLocal(updated: WithdrawalBatchItemWithNft) {
    setBatch((b) =>
      b ? { ...b, items: b.items.map((i) => (i.id === updated.id ? updated : i)) } : b,
    );
  }

  async function updateItem(
    item: WithdrawalBatchItemWithNft,
    patch: { steps?: Record<string, boolean>; nft_status?: NftStatus; withdrawal_tx_hash?: string | null },
  ) {
    try {
      const updated = await api.updateBatchItem(item.id, patch);
      patchItemLocal(updated);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Update failed.', 'error');
    }
  }

  async function exportReport() {
    if (!id) return;
    try {
      const blob = await api.exportBatchCsv(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vaultbridge-batch-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Export failed.', 'error');
    }
  }

  if (loading) {
    return (
      <AppShell title="Batch">
        <div className="text-platinum-400">Loading batch…</div>
      </AppShell>
    );
  }
  if (!batch) {
    return (
      <AppShell title="Batch">
        <div className="text-platinum-400">
          Batch not found.{' '}
          <Link to="/batches" className="text-electric-300">
            Back to batches
          </Link>
        </div>
      </AppShell>
    );
  }

  const wallet = batch.destination_wallet;

  return (
    <AppShell title={batch.name}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/batches" className="text-sm text-electric-300 hover:underline">
            ← All batches
          </Link>
          <button className="btn-secondary px-3 py-1.5 text-xs" onClick={exportReport}>
            Export report (CSV)
          </button>
        </div>

        <div className="card space-y-4 p-5">
          <BatchProgress counts={counts} />
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-obsidian-800 pt-4">
            <div className="text-sm">
              <span className="text-platinum-400">Destination wallet: </span>
              {wallet ? (
                <span className="font-medium text-platinum-100">
                  {wallet.name}
                  {!wallet.tested && (
                    <span className="ml-2 text-xs text-amber-300">(untested)</span>
                  )}
                </span>
              ) : (
                <span className="text-amber-300">Not assigned</span>
              )}
            </div>
            {wallet && <AddressPreview address={wallet.address} />}
          </div>
        </div>

        <SafetyNotice />

        <div className="space-y-4">
          {batch.items.map((item, idx) => {
            const nft = item.nft;
            const txUrl = explorerTxUrl(nft.chain, nft.withdrawal_tx_hash);
            return (
              <div key={item.id} className="card p-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  {/* Image */}
                  <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-obsidian-850">
                    {nft.image_url ? (
                      <img src={nft.image_url} alt={nft.nft_name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-platinum-400">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Details + actions */}
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-platinum-400">
                          #{idx + 1} · {nft.collection_name}
                        </p>
                        <h3 className="truncate text-base font-semibold text-platinum-100">
                          {nft.nft_name}
                          {nft.edition_number ? ` #${nft.edition_number}` : ''}
                        </h3>
                      </div>
                      <StatusBadge status={nft.current_status} />
                    </div>

                    {/* Quick actions */}
                    <div className="flex flex-wrap gap-2">
                      {nft.crypto_com_nft_url && (
                        <a
                          href={nft.crypto_com_nft_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary px-3 py-1.5 text-xs"
                        >
                          Open NFT page ↗
                        </a>
                      )}
                      {wallet && <CopyButton value={wallet.address} label="Copy wallet address" />}
                      <button
                        className="btn-secondary px-3 py-1.5 text-xs"
                        onClick={() => updateItem(item, { nft_status: 'submitted', steps: { submit: true } })}
                      >
                        Mark withdrawal submitted
                      </button>
                      <button
                        className="btn-primary px-3 py-1.5 text-xs"
                        onClick={() =>
                          updateItem(item, { nft_status: 'completed', steps: { mark_completed: true } })
                        }
                      >
                        Mark completed
                      </button>
                    </div>

                    {/* Tx hash */}
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        className="input max-w-xs font-mono text-xs"
                        placeholder="Transaction hash (0x…)"
                        defaultValue={nft.withdrawal_tx_hash ?? ''}
                        onBlur={(e) => {
                          const v = e.target.value.trim();
                          if (v && !isValidTxHash(v)) {
                            toast('That does not look like a valid transaction hash.', 'error');
                            return;
                          }
                          if (v !== (nft.withdrawal_tx_hash ?? '')) {
                            updateItem(item, {
                              withdrawal_tx_hash: v || null,
                              nft_status: v ? 'pending_onchain' : undefined,
                              steps: v ? { add_tx_hash: true } : undefined,
                            });
                          }
                        }}
                      />
                      {txUrl && (
                        <a
                          href={txUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-electric-300 hover:underline"
                        >
                          Verify on explorer ↗
                        </a>
                      )}
                      <select
                        className="input ml-auto max-w-[180px] text-xs"
                        value={nft.current_status}
                        onChange={(e) => updateItem(item, { nft_status: e.target.value as NftStatus })}
                      >
                        {NFT_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {NFT_STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Checklist */}
                    <div className="grid gap-1.5 sm:grid-cols-2">
                      {WITHDRAWAL_STEPS.map((step) => {
                        const checked = Boolean(item.steps?.[step.key]);
                        return (
                          <label
                            key={step.key}
                            className="flex items-center gap-2 text-xs text-platinum-300"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked;
                                const mappedStatus = next ? STEP_STATUS[step.key] : undefined;
                                updateItem(item, {
                                  steps: { [step.key]: next },
                                  nft_status: mappedStatus,
                                });
                              }}
                              className="h-4 w-4 accent-electric-500"
                            />
                            {step.label}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
