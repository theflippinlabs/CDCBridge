import { Router } from 'express';
import { isChainId, validateAddress, type WalletInput } from '@vaultbridge/shared';
import { asyncHandler, HttpError } from '../middleware/error.js';
import type { AuthedRequest } from '../middleware/auth.js';
import { writeAudit } from '../lib/audit.js';

export const walletsRouter = Router();

walletsRouter.get(
  '/wallets',
  asyncHandler(async (req, res) => {
    const { db } = req as AuthedRequest;
    const { data, error } = await db
      .from('wallets')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw new HttpError(400, error.message);
    res.json({ wallets: data });
  }),
);

walletsRouter.post(
  '/wallets',
  asyncHandler(async (req, res) => {
    const { db, userId } = req as AuthedRequest;
    const body = req.body as WalletInput;

    if (!body?.name?.trim()) throw new HttpError(422, 'Wallet name is required.');
    if (!body?.chain || !isChainId(body.chain)) throw new HttpError(422, 'A valid chain is required.');
    const addrCheck = validateAddress(body.address ?? '', body.chain);
    if (!addrCheck.valid) throw new HttpError(422, addrCheck.message ?? 'Invalid address.');

    // If this wallet is set as default, clear the previous default first.
    if (body.is_default) {
      await db.from('wallets').update({ is_default: false }).eq('user_id', userId);
    }

    const { data, error } = await db
      .from('wallets')
      .insert({
        user_id: userId,
        name: body.name.trim(),
        chain: body.chain,
        address: body.address.trim(),
        notes: body.notes ?? null,
        is_default: Boolean(body.is_default),
        tested: Boolean(body.tested),
      })
      .select('*')
      .single();
    if (error) throw new HttpError(400, error.message);

    await writeAudit(db, userId, 'wallet_created', 'wallet', data.id, { name: data.name });
    res.status(201).json({ wallet: data });
  }),
);

walletsRouter.patch(
  '/wallets/:id',
  asyncHandler(async (req, res) => {
    const { db, userId } = req as AuthedRequest;
    const id = req.params.id;
    const body = req.body as Partial<WalletInput>;

    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.notes !== undefined) update.notes = body.notes;
    if (body.tested !== undefined) update.tested = Boolean(body.tested);

    if (body.chain !== undefined) {
      if (!isChainId(body.chain)) throw new HttpError(422, 'Invalid chain.');
      update.chain = body.chain;
    }
    if (body.address !== undefined) {
      const chain = (body.chain as WalletInput['chain']) ?? undefined;
      // Validate against provided chain, falling back to cronos default check.
      const check = validateAddress(body.address, chain ?? 'cronos');
      if (!check.valid) throw new HttpError(422, check.message ?? 'Invalid address.');
      update.address = body.address.trim();
    }

    if (body.is_default === true) {
      await db.from('wallets').update({ is_default: false }).eq('user_id', userId);
      update.is_default = true;
    } else if (body.is_default === false) {
      update.is_default = false;
    }

    const { data, error } = await db
      .from('wallets')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new HttpError(400, error.message);
    if (!data) throw new HttpError(404, 'Wallet not found.');

    await writeAudit(db, userId, 'wallet_updated', 'wallet', id, update);
    res.json({ wallet: data });
  }),
);

walletsRouter.delete(
  '/wallets/:id',
  asyncHandler(async (req, res) => {
    const { db, userId } = req as AuthedRequest;
    const id = req.params.id;
    const { error } = await db.from('wallets').delete().eq('id', id);
    if (error) throw new HttpError(400, error.message);
    await writeAudit(db, userId, 'wallet_deleted', 'wallet', id);
    res.status(204).end();
  }),
);
