import { Router } from 'express';
import {
  isChainId,
  isNftStatus,
  validateCsv,
  type NftInput,
} from '@vaultbridge/shared';
import { asyncHandler, HttpError } from '../middleware/error.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';

export const nftsRouter = Router();

nftsRouter.get(
  '/nfts',
  asyncHandler(async (req, res) => {
    const { db } = req as AuthedRequest;
    let query = db.from('nfts').select('*').order('created_at', { ascending: false });

    const { status, collection } = req.query as { status?: string; collection?: string };
    if (status && isNftStatus(status)) query = query.eq('current_status', status);
    if (collection) query = query.eq('collection_name', collection);

    const { data, error } = await query;
    if (error) throw new HttpError(400, error.message);
    res.json({ nfts: data });
  }),
);

nftsRouter.post(
  '/nfts',
  asyncHandler(async (req, res) => {
    const { db, userId } = req as AuthedRequest;
    const body = req.body as NftInput;
    if (!body?.collection_name?.trim()) throw new HttpError(422, 'collection_name is required.');
    if (!body?.nft_name?.trim()) throw new HttpError(422, 'nft_name is required.');
    const chain = body.chain && isChainId(body.chain) ? body.chain : 'cronos';

    const { data, error } = await db
      .from('nfts')
      .insert({
        user_id: userId,
        collection_name: body.collection_name.trim(),
        nft_name: body.nft_name.trim(),
        edition_number: body.edition_number ?? null,
        token_id: body.token_id ?? null,
        chain,
        marketplace_source: body.marketplace_source ?? null,
        current_status: body.current_status ?? 'stored_on_crypto_com',
        image_url: body.image_url ?? null,
        crypto_com_nft_url: body.crypto_com_nft_url ?? null,
        notes: body.notes ?? null,
      })
      .select('*')
      .single();
    if (error) throw new HttpError(400, error.message);

    await writeAudit(db, userId, 'nft_created', 'nft', data.id, { nft_name: data.nft_name });
    res.status(201).json({ nft: data });
  }),
);

nftsRouter.post(
  '/nfts/import-csv',
  asyncHandler(async (req, res) => {
    const { db, userId } = req as AuthedRequest;
    const { content } = req.body as { content?: string };
    if (!content || typeof content !== 'string') {
      throw new HttpError(422, 'Request body must include a "content" CSV string.');
    }

    const result = validateCsv(content);
    if (result.validCount === 0) {
      // Nothing importable — return the per-row errors for the UI to display.
      return res.status(422).json({ error: 'No valid rows to import.', result });
    }

    const rows = result.rows
      .filter((r) => r.valid && r.data)
      .map((r) => ({ ...(r.data as NftInput), user_id: userId }));

    const { data, error } = await db.from('nfts').insert(rows).select('id');
    if (error) throw new HttpError(400, error.message);

    await writeAudit(db, userId, 'nft_imported', 'nft', null, { count: data.length });
    return res.status(201).json({ imported: data.length, result });
  }),
);

nftsRouter.patch(
  '/nfts/:id',
  asyncHandler(async (req, res) => {
    const { db, userId } = req as AuthedRequest;
    const id = req.params.id;
    const body = req.body as Partial<NftInput>;

    const update: Record<string, unknown> = {};
    const passthrough: (keyof NftInput)[] = [
      'collection_name',
      'nft_name',
      'edition_number',
      'token_id',
      'marketplace_source',
      'image_url',
      'crypto_com_nft_url',
      'destination_wallet_id',
      'withdrawal_tx_hash',
      'notes',
    ];
    for (const key of passthrough) {
      if (body[key] !== undefined) update[key] = body[key];
    }
    if (body.chain !== undefined) {
      if (!isChainId(body.chain)) throw new HttpError(422, 'Invalid chain.');
      update.chain = body.chain;
    }
    if (body.current_status !== undefined) {
      if (!isNftStatus(body.current_status)) throw new HttpError(422, 'Invalid status.');
      update.current_status = body.current_status;
    }
    if (Object.keys(update).length === 0) throw new HttpError(422, 'No fields to update.');

    const { data, error } = await db.from('nfts').update(update).eq('id', id).select('*').single();
    if (error) throw new HttpError(400, error.message);
    if (!data) throw new HttpError(404, 'NFT not found.');

    if (body.current_status !== undefined) {
      await writeAudit(db, userId, 'status_changed', 'nft', id, { status: body.current_status });
    }
    if (body.withdrawal_tx_hash !== undefined) {
      await writeAudit(db, userId, 'tx_hash_added', 'nft', id, { tx: body.withdrawal_tx_hash });
    }
    if (body.destination_wallet_id !== undefined) {
      await writeAudit(db, userId, 'wallet_assigned', 'nft', id, {
        wallet: body.destination_wallet_id,
      });
    }
    res.json({ nft: data });
  }),
);

nftsRouter.delete(
  '/nfts/:id',
  asyncHandler(async (req, res) => {
    const { db, userId } = req as AuthedRequest;
    const id = req.params.id;
    const { error } = await db.from('nfts').delete().eq('id', id);
    if (error) throw new HttpError(400, error.message);
    await writeAudit(db, userId, 'nft_deleted', 'nft', id);
    res.status(204).end();
  }),
);
