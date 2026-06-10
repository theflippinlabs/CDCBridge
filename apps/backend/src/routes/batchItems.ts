import { Router } from 'express';
import { isNftStatus } from '@vaultbridge/shared';
import { asyncHandler, HttpError } from '../middleware/error.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';

export const batchItemsRouter = Router();

/**
 * Update a batch item's checklist steps and/or drive the underlying NFT's
 * status forward. Both the step map and an NFT status change can be sent
 * together (e.g. ticking "submit" while moving the NFT to `submitted`).
 */
batchItemsRouter.patch(
  '/batch-items/:id/status',
  asyncHandler(async (req, res) => {
    const { db, userId } = req as AuthedRequest;
    const id = req.params.id;
    const body = req.body as {
      steps?: Record<string, boolean>;
      nft_status?: string;
      withdrawal_tx_hash?: string | null;
    };

    // Load the item to find the linked NFT.
    const { data: item, error: itemErr } = await db
      .from('withdrawal_batch_items')
      .select('*, nft:nfts(id)')
      .eq('id', id)
      .single();
    if (itemErr) throw new HttpError(400, itemErr.message);
    if (!item) throw new HttpError(404, 'Batch item not found.');

    if (body.steps) {
      const merged = { ...(item.steps ?? {}), ...body.steps };
      const { error } = await db
        .from('withdrawal_batch_items')
        .update({ steps: merged })
        .eq('id', id);
      if (error) throw new HttpError(400, error.message);
    }

    const nftId = (item.nft as { id: string } | null)?.id ?? item.nft_id;
    const nftUpdate: Record<string, unknown> = {};
    if (body.nft_status !== undefined) {
      if (!isNftStatus(body.nft_status)) throw new HttpError(422, 'Invalid NFT status.');
      nftUpdate.current_status = body.nft_status;
    }
    if (body.withdrawal_tx_hash !== undefined) {
      nftUpdate.withdrawal_tx_hash = body.withdrawal_tx_hash;
    }
    if (Object.keys(nftUpdate).length > 0) {
      const { error } = await db.from('nfts').update(nftUpdate).eq('id', nftId);
      if (error) throw new HttpError(400, error.message);
      if (body.nft_status !== undefined) {
        await writeAudit(db, userId, 'status_changed', 'nft', nftId, { status: body.nft_status });
      }
      if (body.withdrawal_tx_hash) {
        await writeAudit(db, userId, 'tx_hash_added', 'nft', nftId, {
          tx: body.withdrawal_tx_hash,
        });
      }
    }

    // Return the refreshed item with its NFT for the UI.
    const { data: fresh, error: freshErr } = await db
      .from('withdrawal_batch_items')
      .select('*, nft:nfts(*)')
      .eq('id', id)
      .single();
    if (freshErr) throw new HttpError(400, freshErr.message);
    res.json({ item: fresh });
  }),
);
