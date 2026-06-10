import { useState } from 'react';

export function CopyButton({
  value,
  label = 'Copy',
  className = '',
}: {
  value: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be blocked; fail quietly.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`btn-secondary px-3 py-1.5 text-xs ${className}`}
      aria-label={`Copy ${label}`}
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}
