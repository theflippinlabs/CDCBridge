import type { Nft } from '@vaultbridge/shared';
import { StatusBadge } from './StatusBadge';

export function NFTCard({
  nft,
  selected,
  onToggle,
  onClick,
}: {
  nft: Nft;
  selected?: boolean;
  onToggle?: (id: string) => void;
  onClick?: (nft: Nft) => void;
}) {
  return (
    <div
      className={`card overflow-hidden transition ${
        selected ? 'ring-1 ring-electric-500' : 'hover:border-obsidian-600'
      }`}
    >
      <div className="relative aspect-square bg-obsidian-850">
        {nft.image_url ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img
            src={nft.image_url}
            alt={nft.nft_name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-platinum-400">No image</div>
        )}
        {onToggle && (
          <label className="absolute left-2 top-2 flex cursor-pointer items-center rounded bg-obsidian-950/70 p-1.5">
            <input
              type="checkbox"
              checked={Boolean(selected)}
              onChange={() => onToggle(nft.id)}
              className="h-4 w-4 accent-electric-500"
            />
          </label>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div>
          <p className="truncate text-xs uppercase tracking-wide text-platinum-400">
            {nft.collection_name}
          </p>
          <button
            className="truncate text-left text-sm font-semibold text-platinum-100 hover:text-electric-300"
            onClick={() => onClick?.(nft)}
            title={nft.nft_name}
          >
            {nft.nft_name}
            {nft.edition_number ? ` #${nft.edition_number}` : ''}
          </button>
        </div>
        <StatusBadge status={nft.current_status} />
      </div>
    </div>
  );
}
