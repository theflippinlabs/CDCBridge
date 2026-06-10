import { Router } from 'express';
import { NFT_STATUS_LABELS, type NftStatus } from '@vaultbridge/shared';
import { asyncHandler, HttpError } from '../middleware/error.js';
import type { AuthedRequest } from '../middleware/auth.js';

export const exportRouter = Router();

/** Quote a CSV cell, escaping embedded quotes. */
function cell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

exportRouter.post(
  '/export/batch/:id',
  asyncHandler(async (req, res) => {
    const { db } = req as AuthedRequest;
    const id = req.params.id;

    const { data: batch, error } = await db
      .from('withdrawal_batches')
      .select(
        '*, destination_wallet:wallets(name,address,chain), items:withdrawal_batch_items(position, nft:nfts(*))',
      )
      .eq('id', id)
      .single();
    if (error) throw new HttpError(400, error.message);
    if (!batch) throw new HttpError(404, 'Batch not found.');

    const wallet = batch.destination_wallet as
      | { name: string; address: string; chain: string }
      | null;

    const header = [
      'collection_name',
      'nft_name',
      'edition_number',
      'token_id',
      'chain',
      'status',
      'destination_wallet',
      'destination_address',
      'withdrawal_tx_hash',
      'crypto_com_nft_url',
    ];

    type Item = { position: number; nft: Record<string, unknown> };
    const items = ((batch.items as Item[]) ?? []).sort((a, b) => a.position - b.position);

    const lines = [header.map(cell).join(',')];
    for (const it of items) {
      const nft = it.nft;
      lines.push(
        [
          nft.collection_name,
          nft.nft_name,
          nft.edition_number,
          nft.token_id,
          nft.chain,
          NFT_STATUS_LABELS[nft.current_status as NftStatus] ?? nft.current_status,
          wallet?.name ?? '',
          wallet?.address ?? '',
          nft.withdrawal_tx_hash,
          nft.crypto_com_nft_url,
        ]
          .map(cell)
          .join(','),
      );
    }

    const csv = lines.join('\n');
    const filename = `vaultbridge-batch-${id}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  }),
);
