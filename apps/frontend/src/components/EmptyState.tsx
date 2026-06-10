import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
  icon = '◇',
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: string;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-obsidian-600 bg-obsidian-850 text-xl text-electric-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-platinum-100">{title}</h3>
      {description && <p className="max-w-md text-sm text-platinum-400">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
