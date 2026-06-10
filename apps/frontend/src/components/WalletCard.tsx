import { CHAINS, type Wallet } from '@vaultbridge/shared';
import { AddressPreview } from './AddressPreview';

export function WalletCard({
  wallet,
  onEdit,
  onDelete,
  onMakeDefault,
}: {
  wallet: Wallet;
  onEdit?: (w: Wallet) => void;
  onDelete?: (w: Wallet) => void;
  onMakeDefault?: (w: Wallet) => void;
}) {
  const chainLabel = CHAINS.find((c) => c.id === wallet.chain)?.label ?? wallet.chain;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-platinum-100">{wallet.name}</h3>
            {wallet.is_default && (
              <span className="rounded-full border border-electric-500/40 bg-electric-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-electric-300">
                Default
              </span>
            )}
            {wallet.tested ? (
              <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-300">
                Tested
              </span>
            ) : (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-300">
                Untested
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-platinum-400">{chainLabel}</p>
        </div>
      </div>

      <div className="mt-3">
        <AddressPreview address={wallet.address} />
      </div>

      {wallet.notes && <p className="mt-3 text-sm text-platinum-300">{wallet.notes}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {!wallet.is_default && onMakeDefault && (
          <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => onMakeDefault(wallet)}>
            Make default
          </button>
        )}
        {onEdit && (
          <button className="btn-secondary px-3 py-1.5 text-xs" onClick={() => onEdit(wallet)}>
            Edit
          </button>
        )}
        {onDelete && (
          <button className="btn-danger px-3 py-1.5 text-xs" onClick={() => onDelete(wallet)}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
