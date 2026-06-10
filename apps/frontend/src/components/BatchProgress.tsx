import { TERMINAL_STATUSES, type NftStatus } from '@vaultbridge/shared';

export interface BatchCounts {
  total: number;
  completed: number;
  pending: number;
  failed: number;
}

export function countsFromStatuses(statuses: NftStatus[]): BatchCounts {
  const total = statuses.length;
  const completed = statuses.filter((s) => s === 'completed').length;
  const failed = statuses.filter((s) => s === 'failed').length;
  const pending = statuses.filter((s) => !TERMINAL_STATUSES.includes(s)).length;
  return { total, completed, pending, failed };
}

export function BatchProgress({ counts }: { counts: BatchCounts }) {
  const { total, completed, pending, failed } = counts;
  const done = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-platinum-200">{done}% complete</span>
        <span className="text-platinum-400">
          {completed}/{total} withdrawn
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-obsidian-700">
        <div
          className="h-full rounded-full bg-electric-500 transition-all"
          style={{ width: `${done}%` }}
        />
      </div>
      <div className="flex gap-4 text-xs">
        <span className="text-emerald-300">● {completed} completed</span>
        <span className="text-platinum-300">● {pending} pending</span>
        <span className="text-red-300">● {failed} failed</span>
      </div>
    </div>
  );
}
