import type { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  hint,
  accent = false,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-platinum-400">{label}</p>
        {icon && <span className="text-platinum-400">{icon}</span>}
      </div>
      <p
        className={`mt-2 text-3xl font-bold ${accent ? 'text-electric-400' : 'text-platinum-50'}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-platinum-400">{hint}</p>}
    </div>
  );
}
