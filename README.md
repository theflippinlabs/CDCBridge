# VaultBridge — by Flipping Labs

**A secure NFT bulk-withdrawal assistant for Crypto.com NFT users.**

VaultBridge helps you **prepare, track, organize, and manually execute**
withdrawals of NFTs from your Crypto.com NFT account to your Crypto.com
Onchain Wallet (Cronos). It is a **withdrawal workflow manager — not a bot.**

> ### What VaultBridge does NOT do
> - ❌ It does **not** store Crypto.com credentials.
> - ❌ It does **not** store private keys (wallet addresses only).
> - ❌ It does **not** automate login, 2FA, email codes, or captchas.
> - ❌ It does **not** scrape authenticated pages or run hidden browser automation.
> - ❌ It cannot bypass Crypto.com's confirmation flow.
>
> You perform every withdrawal yourself, inside Crypto.com. VaultBridge keeps
> you organized and records your progress. **You remain responsible for every
> withdrawal confirmation.**

---

## Features

- **Auth** — Supabase email + Google login, protected dashboard, per-user profiles.
- **Wallet manager** — save destination wallets with address validation, a default
  wallet, and a required "I tested this address" confirmation before bulk use.
- **NFT inventory** — import via CSV, paste-from-table, or manual entry; filter,
  search, and duplicate detection.
- **Bulk withdrawal queue** — group NFTs into batches under one destination wallet.
- **Smart assistant** — per-NFT guided checklist (open page → withdraw → paste
  address → email code → 2FA → submit → tx hash → complete), progress bar,
  completed/pending/failed counts, copy buttons, and explorer links.
- **Bulk tools** — select all, filter by collection/status, bulk assign wallet,
  bulk mark completed, bulk export CSV, bulk remove.
- **Audit logging** — every important action is recorded to an append-only log.
- **Safety UX** — persistent withdrawal warnings and typed confirmation for
  destructive actions.

## Tech stack

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Frontend | React + Vite + TypeScript + TailwindCSS           |
| Backend  | Node.js + Express + TypeScript                    |
| Database | Supabase PostgreSQL (Row Level Security)          |
| Auth     | Supabase Auth (email + Google)                    |
| Payments | Stripe-ready structure (billing **not** activated)|

## Repository structure

```
.
├── apps/
│   ├── frontend/      # React + Vite SPA
│   └── backend/       # Express API
├── packages/
│   └── shared/        # Shared TS types, constants, validation
├── supabase/
│   └── migrations/    # SQL schema + RLS policies
├── .env.example
└── README.md
```

---

## Local development

### 0. Prerequisites
- Node.js ≥ 20
- A free [Supabase](https://supabase.com) project

### 1. Install & build shared types
```bash
npm install
npm run build:shared   # the frontend/backend import @vaultbridge/shared from dist
```

### 2. Apply the database schema
In the Supabase dashboard → **SQL Editor**, paste and run the contents of
`supabase/migrations/0001_init.sql`. This creates all tables, triggers, and
Row Level Security policies. (Or use the Supabase CLI: `supabase db push`.)

### 3. Enable auth providers
Supabase dashboard → **Authentication → Providers**:
- Enable **Email**.
- Enable **Google** and add your OAuth client ID/secret. Add
  `http://localhost:5173` (and your production URL) to the redirect allow-list.

### 4. Configure environment variables
Copy the examples and fill in values from Supabase → **Settings → API**:
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```
- Backend needs `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  and `SUPABASE_JWT_SECRET` (Settings → API → JWT Secret).
- Frontend needs `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and
  `VITE_API_BASE_URL` (default `http://localhost:4000`).

### 5. Run the apps (two terminals)
```bash
npm run dev:backend    # http://localhost:4000  (GET /health to check)
npm run dev:frontend   # http://localhost:5173
```

---

## How the workflow works

1. **Add a wallet** (`/wallets`) — your Onchain Wallet (Cronos) address. Confirm
   you tested it with a small transfer first.
2. **Import NFTs** (`/inventory`) — CSV, paste-from-table, or manual.
   CSV columns: `collection_name,nft_name,edition_number,token_id,chain,crypto_com_nft_url,image_url,notes`
   (`collection_name` and `nft_name` are required; rows are validated with a preview).
3. **Create a batch** — select NFTs, assign a destination wallet, create a batch.
4. **Process the batch** (`/batches/:id`) — work through each NFT's checklist,
   copy the address, open the Crypto.com NFT page, perform the withdrawal **on
   Crypto.com**, paste the tx hash, and mark steps complete. Export a CSV report
   any time.

---

## API reference (backend)

All `/api/*` routes require a Supabase access token (`Authorization: Bearer …`).
Row Level Security guarantees you only ever touch your own rows.

| Method | Path                              | Description                       |
| ------ | --------------------------------- | --------------------------------- |
| GET    | `/health`                         | Health check (public)             |
| GET    | `/api/nfts`                       | List NFTs (`?status=&collection=`)|
| POST   | `/api/nfts`                       | Create an NFT                     |
| POST   | `/api/nfts/import-csv`            | Import NFTs from a CSV string     |
| PATCH  | `/api/nfts/:id`                   | Update an NFT                     |
| DELETE | `/api/nfts/:id`                   | Delete an NFT                     |
| GET    | `/api/wallets`                    | List wallets                      |
| POST   | `/api/wallets`                    | Create a wallet                   |
| PATCH  | `/api/wallets/:id`                | Update a wallet                   |
| DELETE | `/api/wallets/:id`                | Delete a wallet                   |
| POST   | `/api/batches`                    | Create a batch from NFT ids       |
| GET    | `/api/batches`                    | List batches with item statuses   |
| GET    | `/api/batches/:id`                | Batch detail (wallet + items+NFTs)|
| PATCH  | `/api/batches/:id`                | Update a batch                    |
| PATCH  | `/api/batch-items/:id/status`     | Update checklist / NFT status     |
| POST   | `/api/export/batch/:id`           | Download a batch report (CSV)     |

---

## Deployment

### Supabase (database + auth)
1. Create a project. Run `supabase/migrations/0001_init.sql` in the SQL editor.
2. Enable Email + Google providers; add production redirect URLs.

### Backend → Railway
1. New project → **Deploy from GitHub repo**.
2. Set the service **root directory** to `apps/backend`.
3. Build command: `npm install && npm run build` (run at repo root) — or set
   Railway's root to the repo and build with `npm run build`. Start command:
   `npm run start --workspace @vaultbridge/backend` (a `Procfile` is included).
4. Add env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `SUPABASE_JWT_SECRET`, `CORS_ORIGINS=https://your-frontend.vercel.app`, `PORT`.

### Frontend → Vercel
1. Import the repo. Set **root directory** to `apps/frontend`.
2. Build command `npm run build`, output dir `dist`. (`vercel.json` adds the SPA
   rewrite so client-side routes work.)
3. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `VITE_API_BASE_URL=https://your-backend.up.railway.app`.

> Because the apps import `@vaultbridge/shared`, ensure the shared package is
> built during deploy. Building from the repo root (`npm run build`) handles this
> automatically.

---

## Security & compliance notes

- The backend verifies the Supabase JWT and forwards it to PostgREST, so **RLS
  enforces ownership** on every query.
- `audit_logs` has **insert + select** policies only — no update/delete — making
  it effectively append-only.
- The service-role key is used **only** on the backend and is never shipped to
  the browser.
- Stripe keys are present in the env structure but billing is intentionally
  **not activated** in this MVP.

## License

Proprietary — © Flipping Labs. For MVP testing.
