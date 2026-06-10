import { useState } from 'react';
import { CHAINS, DEFAULT_CHAIN, type ChainId, type NftInput } from '@vaultbridge/shared';

const EMPTY: NftInput = {
  collection_name: '',
  nft_name: '',
  edition_number: '',
  token_id: '',
  chain: DEFAULT_CHAIN,
  crypto_com_nft_url: '',
  image_url: '',
  notes: '',
};

export function ManualNFTModal({
  open,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (input: NftInput) => Promise<void>;
  saving: boolean;
}) {
  const [form, setForm] = useState<NftInput>(EMPTY);
  if (!open) return null;

  const valid = form.collection_name.trim() && form.nft_name.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <form
        className="card w-full max-w-lg p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          await onSave(form);
          setForm(EMPTY);
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-platinum-100">Add NFT manually</h2>
          <button type="button" className="btn-ghost px-2 py-1" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Collection name *</label>
            <input
              className="input"
              required
              value={form.collection_name}
              onChange={(e) => setForm({ ...form, collection_name: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">NFT name *</label>
            <input
              className="input"
              required
              value={form.nft_name}
              onChange={(e) => setForm({ ...form, nft_name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Edition #</label>
            <input
              className="input"
              value={form.edition_number ?? ''}
              onChange={(e) => setForm({ ...form, edition_number: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Token ID</label>
            <input
              className="input"
              value={form.token_id ?? ''}
              onChange={(e) => setForm({ ...form, token_id: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Chain</label>
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
            <label className="label">Image URL</label>
            <input
              className="input"
              value={form.image_url ?? ''}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Crypto.com NFT URL</label>
            <input
              className="input"
              value={form.crypto_com_nft_url ?? ''}
              onChange={(e) => setForm({ ...form, crypto_com_nft_url: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Notes</label>
            <input
              className="input"
              value={form.notes ?? ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={!valid || saving}>
            {saving ? 'Saving…' : 'Add NFT'}
          </button>
        </div>
      </form>
    </div>
  );
}
