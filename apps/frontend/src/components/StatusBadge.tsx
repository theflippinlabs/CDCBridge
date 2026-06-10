import { NFT_STATUS_LABELS, type NftStatus } from '@vaultbridge/shared';

const STYLES: Record<NftStatus, string> = {
  stored_on_crypto_com: 'border-platinum-400/30 bg-obsidian-800 text-platinum-300',
  queued_for_withdrawal: 'border-electric-500/40 bg-electric-500/10 text-electric-300',
  withdrawal_started: 'border-electric-500/40 bg-electric-500/10 text-electric-300',
  waiting_email_confirmation: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  waiting_2fa: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  submitted: 'border-indigo-400/40 bg-indigo-500/10 text-indigo-300',
  pending_onchain: 'border-indigo-400/40 bg-indigo-500/10 text-indigo-300',
  completed: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  failed: 'border-red-500/40 bg-red-500/10 text-red-300',
  cancelled: 'border-platinum-400/20 bg-obsidian-800 text-platinum-400',
};

export function StatusBadge({ status }: { status: NftStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}
    >
      {NFT_STATUS_LABELS[status]}
    </span>
  );
}
