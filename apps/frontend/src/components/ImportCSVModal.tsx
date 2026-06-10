import { useMemo, useState } from 'react';
import { CSV_COLUMNS, validateCsv, type CsvParseResult } from '@vaultbridge/shared';

const SAMPLE = `${CSV_COLUMNS.join(',')}
Cool Cats,Cool Cat,1024,1024,cronos,https://crypto.com/nft/...,https://img/...,
Bored Apes,Ape,77,77,cronos,,,High value`;

export function ImportCSVModal({
  open,
  onClose,
  onImport,
  importing,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (content: string) => Promise<void>;
  importing: boolean;
}) {
  const [content, setContent] = useState('');
  const preview: CsvParseResult | null = useMemo(
    () => (content.trim() ? validateCsv(content) : null),
    [content],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="card flex max-h-[90vh] w-full max-w-2xl flex-col p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-platinum-100">Import NFTs from CSV</h2>
          <button className="btn-ghost px-2 py-1" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="mt-1 text-xs text-platinum-400">
          Required columns: <code className="text-platinum-200">collection_name</code>,{' '}
          <code className="text-platinum-200">nft_name</code>. Supported:{' '}
          <code className="text-platinum-300">{CSV_COLUMNS.join(', ')}</code>
        </p>

        <textarea
          className="input mt-3 h-40 resize-none font-mono text-xs"
          placeholder={SAMPLE}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <div className="mt-2 flex gap-2 text-xs">
          <button
            className="btn-ghost px-2 py-1"
            onClick={() => setContent(SAMPLE)}
            type="button"
          >
            Load sample
          </button>
          <label className="btn-ghost cursor-pointer px-2 py-1">
            Upload .csv file
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setContent(await file.text());
              }}
            />
          </label>
        </div>

        {preview && (
          <div className="mt-4 flex-1 overflow-y-auto rounded-lg border border-obsidian-700">
            <div className="sticky top-0 flex items-center justify-between border-b border-obsidian-700 bg-obsidian-850 px-3 py-2 text-xs">
              <span className="text-emerald-300">{preview.validCount} valid</span>
              <span className="text-red-300">{preview.invalidCount} invalid</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="text-platinum-400">
                <tr>
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Collection</th>
                  <th className="px-3 py-2">NFT</th>
                  <th className="px-3 py-2">Result</th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r) => (
                  <tr key={r.rowNumber} className="border-t border-obsidian-800">
                    <td className="px-3 py-2 text-platinum-400">{r.rowNumber}</td>
                    <td className="px-3 py-2 text-platinum-200">
                      {r.data?.collection_name ?? '—'}
                    </td>
                    <td className="px-3 py-2 text-platinum-200">{r.data?.nft_name ?? '—'}</td>
                    <td className="px-3 py-2">
                      {r.valid ? (
                        <span className="text-emerald-300">OK</span>
                      ) : (
                        <span className="text-red-300">{r.errors.join('; ')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={!preview || preview.validCount === 0 || importing}
            onClick={() => onImport(content)}
          >
            {importing ? 'Importing…' : `Import ${preview?.validCount ?? 0} NFTs`}
          </button>
        </div>
      </div>
    </div>
  );
}
