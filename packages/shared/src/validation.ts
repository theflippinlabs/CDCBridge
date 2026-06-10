import {
  CHAINS,
  CSV_COLUMNS,
  CSV_REQUIRED_COLUMNS,
  DEFAULT_CHAIN,
  NFT_STATUSES,
  type ChainId,
  type CsvColumn,
} from './constants.js';
import type { CsvParseResult, CsvRowResult, NftInput } from './types.js';

/** EVM-style address: 0x followed by 40 hex chars. Used for Cronos/Ethereum/Polygon. */
const EVM_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

/** EVM tx hash: 0x followed by 64 hex chars. */
const EVM_TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/;

export interface AddressValidation {
  valid: boolean;
  message?: string;
}

/**
 * Validate a destination wallet address for a given chain.
 * All currently-supported chains are EVM-compatible.
 */
export function validateAddress(address: string, chain: ChainId): AddressValidation {
  const trimmed = address.trim();
  if (!trimmed) return { valid: false, message: 'Address is required.' };

  const known = CHAINS.some((c) => c.id === chain);
  if (!known) return { valid: false, message: `Unknown chain: ${chain}.` };

  if (!EVM_ADDRESS_RE.test(trimmed)) {
    return {
      valid: false,
      message: 'Address must be a valid EVM address (0x followed by 40 hex characters).',
    };
  }
  return { valid: true };
}

export function isValidTxHash(hash: string): boolean {
  return EVM_TX_HASH_RE.test(hash.trim());
}

/**
 * Build an explorer transaction URL.
 * Returns null when no tx hash is present or the chain has no explorer,
 * so callers can simply hide the link.
 */
export function explorerTxUrl(chain: ChainId, txHash: string | null | undefined): string | null {
  if (!txHash) return null;
  const chainDef = CHAINS.find((c) => c.id === chain);
  if (!chainDef) return null;
  return `${chainDef.explorer}/tx/${txHash.trim()}`;
}

export function isChainId(value: string): value is ChainId {
  return CHAINS.some((c) => c.id === value);
}

/**
 * Validate a parsed CSV record (already split into header→value pairs).
 * `record` keys are normalized (lowercased, trimmed) column names.
 */
export function validateCsvRow(record: Record<string, string>, rowNumber: number): CsvRowResult {
  const errors: string[] = [];

  for (const col of CSV_REQUIRED_COLUMNS) {
    if (!record[col] || !record[col].trim()) {
      errors.push(`Missing required value for "${col}".`);
    }
  }

  let chain: ChainId = DEFAULT_CHAIN;
  const rawChain = record.chain?.trim().toLowerCase();
  if (rawChain) {
    if (isChainId(rawChain)) {
      chain = rawChain;
    } else {
      errors.push(`Unknown chain "${record.chain}". Allowed: ${CHAINS.map((c) => c.id).join(', ')}.`);
    }
  }

  if (record.crypto_com_nft_url && record.crypto_com_nft_url.trim()) {
    try {
      // eslint-disable-next-line no-new
      new URL(record.crypto_com_nft_url.trim());
    } catch {
      errors.push('crypto_com_nft_url is not a valid URL.');
    }
  }

  if (errors.length > 0) {
    return { rowNumber, valid: false, errors };
  }

  const data: NftInput = {
    collection_name: record.collection_name.trim(),
    nft_name: record.nft_name.trim(),
    edition_number: record.edition_number?.trim() || null,
    token_id: record.token_id?.trim() || null,
    chain,
    crypto_com_nft_url: record.crypto_com_nft_url?.trim() || null,
    image_url: record.image_url?.trim() || null,
    notes: record.notes?.trim() || null,
    current_status: 'stored_on_crypto_com',
  };

  return { rowNumber, valid: true, errors: [], data };
}

/**
 * Minimal, dependency-free CSV parser supporting quoted fields and commas.
 * Returns an array of records keyed by the header row.
 */
export function parseCsv(content: string): Record<string, string>[] {
  const rows = splitCsvRows(content);
  if (rows.length === 0) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    header.forEach((key, i) => {
      record[key] = cells[i] ?? '';
    });
    return record;
  });
}

/** Validate a raw CSV string and return per-row results with a preview. */
export function validateCsv(content: string): CsvParseResult {
  const records = parseCsv(content);
  const rows: CsvRowResult[] = records
    // skip fully-empty trailing rows
    .filter((r) => Object.values(r).some((v) => v.trim() !== ''))
    .map((record, i) => validateCsvRow(record, i + 2)); // +2: 1-based + header row

  return {
    rows,
    validCount: rows.filter((r) => r.valid).length,
    invalidCount: rows.filter((r) => !r.valid).length,
  };
}

/** Returns the list of CSV columns that are missing from a header line. */
export function missingCsvColumns(headerLine: string): CsvColumn[] {
  const present = headerLine
    .split(',')
    .map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  return CSV_COLUMNS.filter((c) => !present.includes(c) && CSV_REQUIRED_COLUMNS.includes(c));
}

export function isNftStatus(value: string): boolean {
  return (NFT_STATUSES as readonly string[]).includes(value);
}

// ── internal helpers ─────────────────────────────────────────────────────

function splitCsvRows(content: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  const text = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      result.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  // flush last field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    result.push(row);
  }
  return result;
}
