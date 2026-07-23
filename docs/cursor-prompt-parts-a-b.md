# Cursor agent prompt — implement Parts A & B

Copy everything inside the fence below into a new Cursor Agent chat in your **forked** repo (with Clerk, Cloudflare R2, and Vercel accounts already created). Fill in the bracketed env values in `.env.local` yourself — do not paste secrets into the chat.

---

```text
You are implementing Parts A & B of the Cloud Platform Engineer assessment MVP in this forked repo.

## Context
- Legacy sample: Plotly Dash monolith under `app/` (leave it running as reference; do NOT try to host Dash on Vercel).
- Design docs already exist under `docs/` (architecture, security, mvp-playbook, implementation-guide, architecture.drawio). Follow `docs/mvp-playbook.md`.
- Target stack: Next.js on Vercel, Clerk auth/RBAC, Cloudflare R2 for curated datasets (S3-compatible).
- Accounts are ALREADY created (Clerk, R2, Vercel). I will put secrets in `.env.local` / Vercel env myself — you create `.env.example` only.

## Goal (one sentence)
Ship a Clerk-protected Next.js catalogue on Vercel with a manifest-driven lazy data path (local CSV in dev, R2 in prod).

## Hard constraints
- DO implement Parts A (repo contracts/config) and B (working Next.js MVP) only.
- DO NOT implement Parts C–F (legacy coexistence, upload pipeline UI, strangling all dashboards, decommissioning Dash).
- DO NOT use AWS, ECS, Terraform, or Cognito.
- DO NOT commit secrets, `.env.local`, or real API keys.
- DO NOT rewrite the Python Dash app into the production host; keep `app/` as legacy reference.
- Prefer a new top-level app (e.g. `portal/`) OR a clear Next.js root if the fork is dedicated to the portal — pick one clean layout and document it in README.

## Part A — implement in-repo

1. Add config manifests matching the sample permissions:
   - `config/dashboards.yaml` (or `.json`) with:
     - customer_analytics → `/dashboards/customer-analytics` → permission `customer_analytics` → dataset `customer_data`
     - sales_dashboard → `/dashboards/sales-dashboard` → permission `sales_dashboard` → dataset `sales_data`
     - financial_reports → `/dashboards/financial-reports` → permission `financial_reports` → dataset `financial_data`
   - `config/datasets.yaml` with local_path + r2_key:
     - customer_data → customer_data.csv → curated/customer/customer_data.csv
     - sales_data → sales_data.csv → curated/sales/sales_data.csv
     - financial_data → financial_data.csv → curated/financial/financial_data.csv

2. Add `.env.example` with (names only):
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   R2_ACCOUNT_ID=
   R2_ACCESS_KEY_ID=
   R2_SECRET_ACCESS_KEY=
   R2_BUCKET=
   R2_ENDPOINT=          # https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   DATA_SOURCE=local     # local | r2
   DATA_ROOT=./data      # used when DATA_SOURCE=local
   AWS_REGION=auto       # required by S3 SDK for R2; use auto

3. Add a short `docs/clerk-rbac.md` explaining how to configure Clerk for pilot users:
   - admin → all three permissions
   - analyst1 → sales_dashboard + financial_reports
   - scientist1 → customer_analytics only
   Prefer Clerk publicMetadata or Organizations roles like `{ "permissions": ["customer_analytics", ...] }`. Document the exact shape the code reads.

4. Ensure sample CSVs remain available for local mode (reuse existing `data/*.csv` or copy into the portal’s data folder).

5. Update root README with: how to run the portal locally, required env vars, and link to docs/mvp-playbook.md.

## Part B — implement the Next.js MVP

Scaffold a TypeScript Next.js App Router app (latest stable Clerk Next.js SDK).

### Features (must all work)

1. **Home** — title “Analytics Platform”; if signed in, show catalogue; if not, CTA to sign in.

2. **Clerk**
   - Middleware protects `/dashboards(.*)` and `/api(.*)` (allow `/sign-in`, `/sign-up`, static assets).
   - Sign-in / sign-up routes using Clerk components.
   - Server-side helpers to read the current user’s permission list from the documented metadata/roles shape.

3. **Catalogue + RBAC**
   - Load `config/dashboards.yaml`.
   - Filter cards by user permissions.
   - Server-side deny (403 page) if user hits a dashboard URL without permission — not CSS-only hiding.
   - Demo expectation: scientist1 sees only Customer; admin sees all three cards (Sales/Financial can be “coming soon” stub pages that still enforce permission).

4. **Lazy dataset API** — `GET /api/datasets/[id]`
   - Require Clerk auth.
   - Resolve id via datasets manifest; 404 if unknown.
   - Authorise only if the user has permission for at least one dashboard that lists that dataset.
   - If DATA_SOURCE=local: read CSV from DATA_ROOT and return JSON records (or a capped preview + rowCount).
   - If DATA_SOURCE=r2: use AWS SDK v3 S3 client pointed at R2 endpoint; either return JSON after server-side GetObject OR return `{ url }` with a short-TTL presigned GetObject URL (prefer server-side parse for MVP simplicity if easier).
   - Never load all datasets at process startup; only load the requested id.

5. **Customer dashboard page** — `/dashboards/customer-analytics`
   - Permission-gated.
   - Calls the dataset API for `customer_data`.
   - Shows at least: row count + one simple visualisation (table is OK; Plotly.js optional).

6. **Sales & Financial routes**
   - Permission-gated stubs (“Not migrated yet”) so catalogue RBAC can be demoed for all three roles without full chart ports.

### Quality bar
- TypeScript, readable structure (`lib/auth.ts`, `lib/manifests.ts`, `lib/data-client.ts`, etc.).
- No secrets in git; add `.gitignore` entries for `.env.local`.
- `npm run build` (or pnpm/yarn) succeeds with DATA_SOURCE=local.
- Brief comment or docs note: Dash WSGI is not hosted on Vercel; this portal is the strangler shell.

## Out of scope (do not build)
- Presigned upload UI / landing→curated promotion pipeline
- Embedding or proxying the legacy Dash app
- Migrating sales/financial chart logic from Python
- Infrastructure as code for Cloudflare/Vercel

## Acceptance checklist (verify before finishing)
- [ ] `config/dashboards.yaml` + `config/datasets.yaml` exist and match sample IDs
- [ ] `.env.example` present; no real secrets committed
- [ ] `docs/clerk-rbac.md` documents metadata shape + pilot users
- [ ] Next.js app runs locally with Clerk + DATA_SOURCE=local
- [ ] Unauthenticated users cannot access `/dashboards/*` or `/api/*`
- [ ] Catalogue filters by permission; direct URL denied without permission
- [ ] `/dashboards/customer-analytics` lazy-loads only `customer_data`
- [ ] README explains local run + that R2 is enabled by setting DATA_SOURCE=r2 and R2_* vars
- [ ] `npm run build` passes

## Working style
- Read `docs/mvp-playbook.md` first, then implement.
- Make coherent commits only if I ask; otherwise just implement on the working tree.
- If Clerk metadata shape needs a choice, pick publicMetadata.permissions: string[] and document it.
- After implementation, print a short “how to demo” (scientist1 vs admin) and which env vars I must set.
```
