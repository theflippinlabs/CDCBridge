import { useMemo, useState } from 'react';
import { CSV_COLUMNS, validateCsv, type CsvParseResult } from '@vaultbridge/shared';

/**
 * Paste-from-table import. Accepts tab- or comma-separated rows copied from a
 * spreadsheet. Columns are mapped positionally to CSV_COLUMNS, so no header
 * row is needed. Internally it normalizes to CSV and reuses the validator.
 */
function pastedToCsv(text: string): string {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  const rows = lines.map((line) => {
    const cells = line.includes('\t') ? line.split('\t') : line.split(',');
    return CSV_COLUMNS.map((_, i) => {
      const v = (cells[i] ?? '').trim().replace(/"/g, '""');
      return `"${v}"`;
    }).join(',');
  });
  return [CSV_COLUMNS.join(','), ...rows].join('\n');
}

export function PasteImportModal({
  open,
  onClose,
  onImport,
  importing,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (csvContent: string) => Promise<void>;
  importing: boolean;
}) {
  const [text, setText] = useState('');
  const csv = useMemo(() => (text.trim() ? pastedToCsv(text) : ''), [text]);
  const preview: CsvParseResult | null = useMemo(
    () => (csv ? validateCsv(csv) : null),
    [csv],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="card flex max-h-[90vh] w-full max-w-2xl flex-col p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-platinum-100">Paste from table</h2>
          <button className="btn-ghost px-2 py-1" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="mt-1 text-xs text-platinum-400">
          Paste rows copied from a spreadsheet. Column order:{' '}
          <code className="text-platinum-300">{CSV_COLUMNS.join(' · ')}</code>
        </p>
        <textarea
          className="input mt-3 h-40 resize-none font-mono text-xs"
          placeholder={'Cool Cats\tCool Cat\t1024\t1024\tcronos'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {preview && (
          <div className="mt-3 text-xs">
            <span className="text-emerald-300">{preview.validCount} valid</span>
            {preview.invalidCount > 0 && (
              <span className="ml-3 text-red-300">{preview.invalidCount} invalid</span>
            )}
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!preview || preview.validCount === 0 || importing}
            onClick={() => onImport(csv)}
          >
            {importing ? 'Importing…' : `Import ${preview?.validCount ?? 0} NFTs`}
          </button>
        </div>
      </div>
    </div>
  );
}
