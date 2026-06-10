import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  NFT_STATUSES,
  NFT_STATUS_LABELS,
  type Nft,
  type NftInput,
  type Wallet,
} from '@vaultbridge/shared';
import { AppShell } from '../components/AppShell';
import { NFTTable } from '../components/NFTTable';
import { NFTCard } from '../components/NFTCard';
import { EmptyState } from '../components/EmptyState';
import { ImportCSVModal } from '../components/ImportCSVModal';
import { ManualNFTModal } from '../components/ManualNFTModal';
import { PasteImportModal } from '../components/PasteImportModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

/** Detect duplicate NFTs by collection + (token_id or name+edition). */
function findDuplicateIds(nfts: Nft[]): Set<string> {
  const seen = new Map<string, string>();
  const dupes = new Set<string>();
  for (const n of nfts) {
    const key = `${n.collection_name}|${n.token_id || `${n.nft_name}#${n.edition_number ?? ''}`}`.toLowerCase();
    if (seen.has(key)) {
      dupes.add(n.id);
      dupes.add(seen.get(key)!);
    } else {
      seen.set(key, n.id);
    }
  }
  return dupes;
}

export function InventoryPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [nfts, setNfts] = useState<Nft[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [collectionFilter, setCollectionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [showCsv, setShowCsv] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [busy, setBusy] = useState(false);

  const [bulkRemove, setBulkRemove] = useState(false);
  const [batchName, setBatchName] = useState('');
  const [batchWalletId, setBatchWalletId] = useState('');
  const [bulkWalletId, setBulkWalletId] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [n, w] = await Promise.all([api.listNfts(), api.listWallets()]);
      setNfts(n);
      setWallets(w);
      const def = w.find((x) => x.is_default);
      if (def) setBatchWalletId((v) => v || def.id);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load inventory.', 'error');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const collections = useMemo(
    () => Array.from(new Set(nfts.map((n) => n.collection_name))).sort(),
    [nfts],
  );
  const duplicateIds = useMemo(() => findDuplicateIds(nfts), [nfts]);

  const filtered = useMemo(
    () =>
      nfts.filter((n) => {
        if (collectionFilter && n.collection_name !== collectionFilter) return false;
        if (statusFilter && n.current_status !== statusFilter) return false;
        if (search && !`${n.nft_name} ${n.collection_name}`.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      }),
    [nfts, collectionFilter, statusFilter, search],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(filtered.map((n) => n.id)) : new Set());
  }
  const selectedNfts = nfts.filter((n) => selected.has(n.id));

  // ── import handlers ───────────────────────────────────────────────────────
  async function importCsv(content: string) {
    setBusy(true);
    try {
      const { imported } = await api.importCsv(content);
      toast(`Imported ${imported} NFTs.`, 'success');
      setShowCsv(false);
      setShowPaste(false);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Import failed.', 'error');
    } finally {
      setBusy(false);
    }
  }
  async function addManual(input: NftInput) {
    setBusy(true);
    try {
      await api.createNft(input);
      toast('NFT added.', 'success');
      setShowManual(false);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Add failed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  // ── bulk actions ──────────────────────────────────────────────────────────
  async function bulkAssign() {
    if (!bulkWalletId) return;
    setBusy(true);
    try {
      await Promise.all(
        selectedNfts.map((n) => api.updateNft(n.id, { destination_wallet_id: bulkWalletId })),
      );
      toast(`Assigned wallet to ${selectedNfts.length} NFTs.`, 'success');
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Assign failed.', 'error');
    } finally {
      setBusy(false);
    }
  }
  async function bulkComplete() {
    setBusy(true);
    try {
      await Promise.all(selectedNfts.map((n) => api.updateNft(n.id, { current_status: 'completed' })));
      toast(`Marked ${selectedNfts.length} completed.`, 'success');
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Update failed.', 'error');
    } finally {
      setBusy(false);
    }
  }
  function bulkExport() {
    const header = ['collection_name', 'nft_name', 'edition_number', 'token_id', 'chain', 'status'];
    const lines = [header.join(',')];
    for (const n of selectedNfts) {
      lines.push(
        [n.collection_name, n.nft_name, n.edition_number, n.token_id, n.chain, n.current_status]
          .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
          .join(','),
      );
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vaultbridge-inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
  async function confirmBulkRemove() {
    setBusy(true);
    try {
      await Promise.all(selectedNfts.map((n) => api.deleteNft(n.id)));
      toast(`Removed ${selectedNfts.length} NFTs.`, 'success');
      setSelected(new Set());
      setBulkRemove(false);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Remove failed.', 'error');
    } finally {
      setBusy(false);
    }
  }
  async function createBatch() {
    if (selectedNfts.length === 0) return;
    setBusy(true);
    try {
      const batch = await api.createBatch({
        name: batchName.trim() || `Batch ${new Date().toLocaleDateString()}`,
        destination_wallet_id: batchWalletId || null,
        nft_ids: selectedNfts.map((n) => n.id),
      });
      toast('Batch created.', 'success');
      navigate(`/batches/${batch.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Batch creation failed.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell title="Inventory">
      <div className="space-y-4">
        {/* Action bar */}
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-primary" onClick={() => setShowCsv(true)}>
            Import CSV
          </button>
          <button className="btn-secondary" onClick={() => setShowPaste(true)}>
            Paste from table
          </button>
          <button className="btn-secondary" onClick={() => setShowManual(true)}>
            Add manually
          </button>
          <div className="ml-auto flex rounded-lg border border-obsidian-700 p-1 text-xs">
            <button
              className={`rounded px-3 py-1 ${view === 'table' ? 'bg-electric-500 text-white' : 'text-platinum-300'}`}
              onClick={() => setView('table')}
            >
              Table
            </button>
            <button
              className={`rounded px-3 py-1 ${view === 'grid' ? 'bg-electric-500 text-white' : 'text-platinum-300'}`}
              onClick={() => setView('grid')}
            >
              Grid
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <input
            className="input max-w-xs"
            placeholder="Search NFTs…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="input max-w-xs"
            value={collectionFilter}
            onChange={(e) => setCollectionFilter(e.target.value)}
          >
            <option value="">All collections</option>
            {collections.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className="input max-w-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {NFT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {NFT_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          {duplicateIds.size > 0 && (
            <span className="self-center rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
              {duplicateIds.size} possible duplicates
            </span>
          )}
        </div>

        {/* Selection toolbar */}
        {selected.size > 0 && (
          <div className="card space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-platinum-200">{selected.size} selected</span>
              <button className="btn-secondary px-3 py-1.5 text-xs" onClick={bulkComplete} disabled={busy}>
                Mark completed
              </button>
              <button className="btn-secondary px-3 py-1.5 text-xs" onClick={bulkExport}>
                Export CSV
              </button>
              <button
                className="btn-danger px-3 py-1.5 text-xs"
                onClick={() => setBulkRemove(true)}
                disabled={busy}
              >
                Remove
              </button>
              <button
                className="btn-ghost px-3 py-1.5 text-xs"
                onClick={() => setSelected(new Set())}
              >
                Clear
              </button>
            </div>

            <div className="flex flex-wrap items-end gap-2 border-t border-obsidian-800 pt-3">
              <div>
                <label className="label">Bulk assign wallet</label>
                <select
                  className="input max-w-xs"
                  value={bulkWalletId}
                  onChange={(e) => setBulkWalletId(e.target.value)}
                >
                  <option value="">Select wallet…</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="btn-secondary px-3 py-2 text-xs"
                onClick={bulkAssign}
                disabled={!bulkWalletId || busy}
              >
                Assign
              </button>
            </div>

            <div className="flex flex-wrap items-end gap-2 border-t border-obsidian-800 pt-3">
              <div>
                <label className="label">New batch name</label>
                <input
                  className="input max-w-xs"
                  placeholder="June withdrawals"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Destination wallet</label>
                <select
                  className="input max-w-xs"
                  value={batchWalletId}
                  onChange={(e) => setBatchWalletId(e.target.value)}
                >
                  <option value="">Choose later</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                      {w.is_default ? ' (default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <button className="btn-primary px-4 py-2 text-xs" onClick={createBatch} disabled={busy}>
                Create withdrawal batch
              </button>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-platinum-400">Loading NFTs…</div>
        ) : nfts.length === 0 ? (
          <EmptyState
            title="No NFTs in your inventory"
            description="Import a CSV, paste from a spreadsheet, or add NFTs manually to start tracking withdrawals."
            icon="▦"
            action={
              <button className="btn-primary" onClick={() => setShowCsv(true)}>
                Import CSV
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No NFTs match your filters" icon="▦" />
        ) : view === 'table' ? (
          <NFTTable
            nfts={filtered}
            selectedIds={selected}
            onToggle={toggle}
            onToggleAll={toggleAll}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((n) => (
              <NFTCard key={n.id} nft={n} selected={selected.has(n.id)} onToggle={toggle} />
            ))}
          </div>
        )}
      </div>

      <ImportCSVModal
        open={showCsv}
        onClose={() => setShowCsv(false)}
        onImport={importCsv}
        importing={busy}
      />
      <PasteImportModal
        open={showPaste}
        onClose={() => setShowPaste(false)}
        onImport={importCsv}
        importing={busy}
      />
      <ManualNFTModal
        open={showManual}
        onClose={() => setShowManual(false)}
        onSave={addManual}
        saving={busy}
      />
      <ConfirmDialog
        open={bulkRemove}
        title={`Remove ${selected.size} NFTs?`}
        danger
        description="This removes the selected NFTs from VaultBridge. It does not affect anything on Crypto.com."
        requireText="REMOVE"
        confirmLabel="Remove NFTs"
        onConfirm={confirmBulkRemove}
        onCancel={() => setBulkRemove(false)}
      />
    </AppShell>
  );
}
