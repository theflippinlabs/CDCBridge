import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TERMINAL_STATUSES, type Nft, type Wallet } from '@vaultbridge/shared';
import { AppShell } from '../components/AppShell';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { SafetyNotice } from '../components/SafetyNotice';
import { EmptyState } from '../components/EmptyState';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';

export function DashboardPage() {
  const { toast } = useToast();
  const [nfts, setNfts] = useState<Nft[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [batchCount, setBatchCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listNfts(), api.listWallets(), api.listBatches()])
      .then(([n, w, b]) => {
        setNfts(n);
        setWallets(w);
        setBatchCount(b.length);
      })
      .catch((e) => toast(e.message ?? 'Failed to load dashboard.', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const completed = nfts.filter((n) => n.current_status === 'completed').length;
  const inProgress = nfts.filter(
    (n) => !TERMINAL_STATUSES.includes(n.current_status) && n.current_status !== 'stored_on_crypto_com',
  ).length;
  const recent = nfts.slice(0, 6);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        <SafetyNotice />

        {loading ? (
          <div className="text-platinum-400">Loading…</div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="NFTs tracked" value={nfts.length} icon="▦" />
              <StatCard label="In progress" value={inProgress} accent icon="◴" />
              <StatCard label="Completed" value={completed} icon="✓" />
              <StatCard label="Saved wallets" value={wallets.length} icon="◈" />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Link to="/inventory" className="card p-5 transition hover:border-electric-500/40">
                <h3 className="font-semibold text-platinum-100">Import inventory</h3>
                <p className="mt-1 text-sm text-platinum-400">
                  Add NFTs via CSV, manual entry, or paste-from-table.
                </p>
              </Link>
              <Link to="/wallets" className="card p-5 transition hover:border-electric-500/40">
                <h3 className="font-semibold text-platinum-100">Manage wallets</h3>
                <p className="mt-1 text-sm text-platinum-400">
                  Save and verify destination Onchain Wallet addresses.
                </p>
              </Link>
              <Link to="/batches" className="card p-5 transition hover:border-electric-500/40">
                <h3 className="font-semibold text-platinum-100">Withdrawal batches</h3>
                <p className="mt-1 text-sm text-platinum-400">
                  {batchCount} batch{batchCount === 1 ? '' : 'es'} — build and track step by step.
                </p>
              </Link>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold text-platinum-100">Recent NFTs</h2>
                <Link to="/inventory" className="text-sm text-electric-300 hover:underline">
                  View all
                </Link>
              </div>
              {recent.length === 0 ? (
                <EmptyState
                  title="No NFTs yet"
                  description="Import your Crypto.com NFT inventory to start preparing withdrawals."
                  action={
                    <Link to="/inventory" className="btn-primary">
                      Go to inventory
                    </Link>
                  }
                />
              ) : (
                <div className="card divide-y divide-obsidian-800">
                  {recent.map((nft) => (
                    <div key={nft.id} className="flex items-center justify-between px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-platinum-100">
                          {nft.nft_name}
                        </p>
                        <p className="truncate text-xs text-platinum-400">{nft.collection_name}</p>
                      </div>
                      <StatusBadge status={nft.current_status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
