import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { countsFromStatuses, BatchProgress } from '../components/BatchProgress';
import { AppShell } from '../components/AppShell';
import { EmptyState } from '../components/EmptyState';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import type { NftStatus, WithdrawalBatch } from '@vaultbridge/shared';

type BatchRow = WithdrawalBatch & { items: { nft: { current_status: NftStatus } }[] };

export function BatchesPage() {
  const { toast } = useToast();
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .listBatches()
      .then((b) => setBatches(b as BatchRow[]))
      .catch((e) => toast(e.message ?? 'Failed to load batches.', 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <AppShell title="Withdrawal batches">
      <div className="space-y-4">
        <p className="text-sm text-platinum-400">
          Batches group NFTs under one destination wallet so you can process withdrawals one by one
          with a guided checklist. Create a batch from the{' '}
          <Link to="/inventory" className="text-electric-300 hover:underline">
            Inventory
          </Link>{' '}
          page by selecting NFTs.
        </p>

        {loading ? (
          <div className="text-platinum-400">Loading…</div>
        ) : batches.length === 0 ? (
          <EmptyState
            title="No batches yet"
            description="Select NFTs in your inventory and create a withdrawal batch to begin."
            icon="⛁"
            action={
              <Link to="/inventory" className="btn-primary">
                Go to inventory
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {batches.map((b) => {
              const counts = countsFromStatuses(b.items?.map((i) => i.nft.current_status) ?? []);
              return (
                <Link
                  key={b.id}
                  to={`/batches/${b.id}`}
                  className="card space-y-3 p-5 transition hover:border-electric-500/40"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-platinum-100">{b.name}</h3>
                    <span className="text-xs text-platinum-400">{counts.total} NFTs</span>
                  </div>
                  <BatchProgress counts={counts} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
