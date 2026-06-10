const WARNINGS = [
  'Always test with one NFT first.',
  'Never paste a wallet address you have not verified.',
  'This app does not control Crypto.com and cannot bypass their confirmation flow.',
  'You remain responsible for every withdrawal confirmation.',
];

/** Persistent safety reminders shown across withdrawal-related screens. */
export function SafetyNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-200/90">
        <strong className="font-semibold">Safety:</strong> {WARNINGS[0]} {WARNINGS[1]}
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <h4 className="text-sm font-semibold text-amber-200">Before you withdraw</h4>
      <ul className="mt-2 space-y-1 text-sm text-amber-200/80">
        {WARNINGS.map((w) => (
          <li key={w} className="flex gap-2">
            <span aria-hidden>⚠</span>
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
