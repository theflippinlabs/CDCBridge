import { useState, type ReactNode } from 'react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /** When set, the user must type this exact text to enable confirm. */
  requireText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal confirmation for destructive / irreversible actions.
 * Optionally requires the user to type a confirmation phrase.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  requireText,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  if (!open) return null;

  const canConfirm = !requireText || typed.trim() === requireText;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="card w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-platinum-100">{title}</h2>
        {description && <div className="mt-2 text-sm text-platinum-300">{description}</div>}

        {requireText && (
          <div className="mt-4">
            <label className="label">
              Type <span className="font-mono text-electric-300">{requireText}</span> to confirm
            </label>
            <input
              className="input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={danger ? 'btn-danger' : 'btn-primary'}
            disabled={!canConfirm}
            onClick={() => {
              setTyped('');
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
