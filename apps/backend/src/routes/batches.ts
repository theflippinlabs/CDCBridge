import { Router } from 'express';
import { BATCH_STATUSES, type BatchStatus } from '@vaultbridge/shared';
import { asyncHandler, HttpError } from '../middleware/error.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';

export const batchesRouter = Router();

interface CreateBatchBody {
  name: string;
  destination_wallet_id?: string | null;
  nft_ids: string[];
  notes?: string | null;
}

batchesRouter.get(
  '/batches',
  asyncHandler(async (req, res) => {
    const { db } = req as AuthedRequest;
    // Pull batches plus their items' NFT statuses so the UI can show counts.
    const { data, error } = await db
      .from('withdrawal_batches')
      .select('*, items:withdrawal_batch_items(id, nft:nfts(current_status))')
      .order('created_at', { ascending: false });
    if (error) throw new HttpError(400, error.message);
    res.json({ batches: data });
  }),
);

batchesRouter.get(
  '/batches/:id',
  asyncHandler(async (req, res) => {
    const { db } = req as AuthedRequest;
    const id = req.params.id;
    const { data, error } = await db
      .from('withdrawal_batches')
      .select(
        '*, destination_wallet:wallets(*), items:withdrawal_batch_items(*, nft:nfts(*))',
      )
      .eq('id', id)
      .single();
    if (error) throw new HttpError(400, error.message);
    if (!data) throw new HttpError(404, 'Batch not found.');

    // Keep items ordered by position for a stable checklist.
    if (Array.isArray(data.items)) {
      data.items.sort((a: { position: number }, b: { position: number }) => a.position - b.position);
    }
    res.json({ batch: data });
  }),
);

batchesRouter.post(
  '/batches',
  asyncHandler(async (req, res) => {
    const { db, userId } = req as AuthedRequest;
    const body = req.body as CreateBatchBody;
    if (!body?.name?.trim()) throw new HttpError(422, 'Batch name is required.');
    if (!Array.isArray(body.nft_ids) || body.nft_ids.length === 0) {
      throw new HttpError(422, 'Select at least one NFT for the batch.');
    }

    const { data: batch, error: batchErr } = await db
      .from('withdrawal_batches')
      .insert({
        user_id: userId,
        name: body.name.trim(),
        destination_wallet_id: body.destination_wallet_id ?? null,
        notes: body.notes ?? null,
        status: 'draft',
      })
      .select('*')
      .single();
    if (batchErr) throw new HttpError(400, batchErr.message);

    const items = body.nft_ids.map((nftId, i) => ({
      batch_id: batch.id,
      nft_id: nftId,
      user_id: userId,
      position: i,
      steps: {},
    }));
    const { error: itemsErr } = await db.from('withdrawal_batch_items').insert(items);
    if (itemsErr) throw new HttpError(400, itemsErr.message);

    // Move the selected NFTs into the queued state and assign the wallet.
    const nftUpdate: Record<string, unknown> = { current_status: 'queued_for_withdrawal' };
    if (body.destination_wallet_id) nftUpdate.destination_wallet_id = body.destination_wallet_id;
    await db.from('nfts').update(nftUpdate).in('id', body.nft_ids);

    await writeAudit(db, userId, 'batch_created', 'batch', batch.id, {
      name: batch.name,
      count: body.nft_ids.length,
    });
    res.status(201).json({ batch });
  }),
);

batchesRouter.patch(
  '/batches/:id',
  asyncHandler(async (req, res) => {
    const { db, userId } = req as AuthedRequest;
    const id = req.params.id;
    const body = req.body as { name?: string; status?: BatchStatus; notes?: string | null };

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.notes !== undefined) update.notes = body.notes;
    if (body.status !== undefined) {
      if (!BATCH_STATUSES.includes(body.status)) throw new HttpError(422, 'Invalid batch status.');
      update.status = body.status;
    }
    if (Object.keys(update).length === 0) throw new HttpError(422, 'No fields to update.');

    const { data, error } = await db
      .from('withdrawal_batches')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new HttpError(400, error.message);
    if (!data) throw new HttpError(404, 'Batch not found.');

    await writeAudit(db, userId, 'batch_updated', 'batch', id, update);
    res.json({ batch: data });
  }),
);
