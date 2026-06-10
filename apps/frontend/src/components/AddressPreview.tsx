import { CopyButton } from './CopyButton';

function shorten(addr: string): string {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

/** Displays a wallet address (shortened) with a copy button. */
export function AddressPreview({
  address,
  showCopy = true,
  full = false,
}: {
  address: string;
  showCopy?: boolean;
  full?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <code className="rounded bg-obsidian-850 px-2 py-1 font-mono text-xs text-platinum-200">
        {full ? address : shorten(address)}
      </code>
      {showCopy && <CopyButton value={address} label="Copy address" />}
    </div>
  );
}
