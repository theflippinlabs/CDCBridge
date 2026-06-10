import { useEffect, useState } from 'react';
import {
  CHAINS,
  DEFAULT_CHAIN,
  validateAddress,
  type ChainId,
  type Wallet,
  type WalletInput,
} from '@vaultbridge/shared';
import { AppShell } from '../components/AppShell';
import { WalletCard } from '../components/WalletCard';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

const EMPTY: WalletInput = { name: '', chain: DEFAULT_CHAIN, address: '', notes: '', is_default: false };

export function WalletsPage() {
  const { toast } = useToast();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<WalletInput>(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tested, setTested] = useState(false);
  const [deleting, setDeleting] = useState<Wallet | null>(null);
  const [saving, setSaving] = useState(false);

  const addrCheck = form.address ? validateAddress(form.address, form.chain) : { valid: false };

  async function load() {
    setLoading(true);
    try {
      setWallets(await api.listWallets());
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed to load wallets.', 'error');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setForm(EMPTY);
    setEditingId(null);
    setTested(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const check = validateAddress(form.address, form.chain);
    if (!check.valid) {
      toast(check.message ?? 'Invalid address.', 'error');
      return;
    }
    if (!tested) {
      toast('Please confirm you have tested this address with a small transfer.', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.updateWallet(editingId, { ...form, tested });
        toast('Wallet updated.', 'success');
      } else {
        await api.createWallet({ ...form, tested });
        toast('Wallet saved.', 'success');
      }
      resetForm();
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(w: Wallet) {
    setEditingId(w.id);
    setForm({
      name: w.name,
      chain: w.chain,
      address: w.address,
      notes: w.notes ?? '',
      is_default: w.is_default,
    });
    setTested(w.tested);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function makeDefault(w: Wallet) {
    try {
      await api.updateWallet(w.id, { is_default: true });
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed.', 'error');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api.deleteWallet(deleting.id);
      toast('Wallet deleted.', 'success');
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Delete failed.', 'error');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <AppShell title="Wallets">
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <form onSubmit={handleSave} className="card h-fit space-y-4 p-5">
          <h2 className="text-base font-semibold text-platinum-100">
            {editingId ? 'Edit wallet' : 'Add destination wallet'}
          </h2>

          <div>
            <label className="label">Wallet name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="My Onchain Wallet"
              required
            />
          </div>

          <div>
            <label className="label">Chain / network</label>
            <select
              className="input"
              value={form.chain}
              onChange={(e) => setForm({ ...form, chain: e.target.value as ChainId })}
            >
              {CHAINS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Wallet address</label>
            <input
              className="input font-mono"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="0x…"
              required
            />
            {form.address && (
              <p className={`mt-1 text-xs ${addrCheck.valid ? 'text-emerald-300' : 'text-red-300'}`}>
                {addrCheck.valid ? '✓ Looks like a valid address' : (addrCheck as { message?: string }).message}
              </p>
            )}
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <textarea
              className="input h-20 resize-none"
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-platinum-200">
            <input
              type="checkbox"
              checked={Boolean(form.is_default)}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
              className="h-4 w-4 accent-electric-500"
            />
            Set as default withdrawal wallet
          </label>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <label className="flex items-start gap-2 text-xs text-amber-200">
              <input
                type="checkbox"
                checked={tested}
                onChange={(e) => setTested(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-amber-400"
              />
              I confirm I tested this address with a small transfer before using it for bulk
              withdrawals. Never paste an address you have not verified.
            </label>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Update wallet' : 'Save wallet'}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="space-y-4">
          {loading ? (
            <div className="text-platinum-400">Loading wallets…</div>
          ) : wallets.length === 0 ? (
            <EmptyState
              title="No wallets saved"
              description="Add your Crypto.com Onchain Wallet (Cronos) destination address to begin."
              icon="◈"
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {wallets.map((w) => (
                <WalletCard
                  key={w.id}
                  wallet={w}
                  onEdit={startEdit}
                  onDelete={setDeleting}
                  onMakeDefault={makeDefault}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete wallet?"
        danger
        description={
          <span>
            This removes <strong>{deleting?.name}</strong> from your saved wallets. NFTs assigned to
            it will keep their recorded address history.
          </span>
        }
        confirmLabel="Delete wallet"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </AppShell>
  );
}
