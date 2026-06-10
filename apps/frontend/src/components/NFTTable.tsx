import type { Nft } from '@vaultbridge/shared';
import { StatusBadge } from './StatusBadge';

export function NFTTable({
  nfts,
  selectedIds,
  onToggle,
  onToggleAll,
  onRowClick,
}: {
  nfts: Nft[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
  onRowClick?: (nft: Nft) => void;
}) {
  const allSelected = nfts.length > 0 && nfts.every((n) => selectedIds.has(n.id));

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-obsidian-700 text-xs uppercase tracking-wide text-platinum-400">
          <tr>
            <th className="px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onToggleAll(e.target.checked)}
                className="h-4 w-4 accent-electric-500"
                aria-label="Select all"
              />
            </th>
            <th className="px-4 py-3">NFT</th>
            <th className="px-4 py-3">Collection</th>
            <th className="px-4 py-3">Edition</th>
            <th className="px-4 py-3">Chain</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {nfts.map((nft) => (
            <tr
              key={nft.id}
              className="border-b border-obsidian-800 last:border-0 hover:bg-obsidian-850/50"
            >
              <td className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(nft.id)}
                  onChange={() => onToggle(nft.id)}
                  className="h-4 w-4 accent-electric-500"
                  aria-label={`Select ${nft.nft_name}`}
                />
              </td>
              <td className="px-4 py-3">
                <button
                  className="font-medium text-platinum-100 hover:text-electric-300"
                  onClick={() => onRowClick?.(nft)}
                >
                  {nft.nft_name}
                </button>
              </td>
              <td className="px-4 py-3 text-platinum-300">{nft.collection_name}</td>
              <td className="px-4 py-3 text-platinum-400">{nft.edition_number ?? '—'}</td>
              <td className="px-4 py-3 text-platinum-400">{nft.chain}</td>
              <td className="px-4 py-3">
                <StatusBadge status={nft.current_status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
