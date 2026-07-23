# Analytics Platform Sample

Legacy **Plotly Dash** monolith under `app/` plus a new **Next.js strangler portal** under `portal/`.

> **Important:** The Dash WSGI app is **not** hosted on Vercel. The Vercel target is `portal/` only — Clerk-protected catalogue, RBAC, and lazy dataset loading (local CSV or Cloudflare R2).

Design docs: [docs/mvp-playbook.md](docs/mvp-playbook.md) · [docs/clerk-rbac.md](docs/clerk-rbac.md) · [docs/architecture.md](docs/architecture.md)

---

## Layout

```
no10-dashboard-sample/
├── app/                 # Legacy Dash (Docker / local Python) — reference only
├── data/                # Sample CSVs for DATA_SOURCE=local
├── config/              # dashboards.yaml + datasets.yaml (shared contracts)
├── docs/                # Architecture, security, MVP playbook, Clerk RBAC
├── portal/              # Next.js App Router MVP (Parts A–B)
├── .env.example         # Env var names (no secrets)
└── docker-compose.yml   # Legacy Dash + Postgres
```

---

## Portal (Next.js) — local run

```bash
cd portal
cp .env.example .env.local   # or copy from repo-root .env.example
# Fill in Clerk keys (required). Keep DATA_SOURCE=local and DATA_ROOT=../data
npm install
npm run dev
# → http://localhost:3000
```

### Required env vars

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `DATA_SOURCE` | `local` (dev) or `r2` (prod) |
| `DATA_ROOT` | From `portal/`: `../data` (repo-root CSVs) |

### Optional — Cloudflare R2

Set `DATA_SOURCE=r2` and:

- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`
- `R2_ENDPOINT` — `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
- `AWS_REGION=auto`

See root [`.env.example`](.env.example) and [`portal/.env.example`](portal/.env.example).

### Clerk pilot users

Configure `publicMetadata.permissions: string[]` per [docs/clerk-rbac.md](docs/clerk-rbac.md):

| User | Permissions |
|------|-------------|
| admin | all three |
| analyst1 | `sales_dashboard`, `financial_reports` |
| scientist1 | `customer_analytics` only |

---

## Legacy Dash — Docker

```bash
docker-compose up --build
# → http://localhost:8050
```

### Demo accounts (Postgres / Dash only)

| Username | Password | Access |
|----------|----------|--------|
| admin | password123 | All dashboards |
| analyst1 | analyst123 | Sales + Financial |
| scientist1 | science123 | Customer only |

---

## Acceptance (Parts A–B)

- [x] `config/dashboards.yaml` + `config/datasets.yaml`
- [x] `.env.example` (no secrets)
- [x] `docs/clerk-rbac.md`
- [x] Portal: Clerk auth, filtered catalogue, server-side 403, lazy `/api/datasets/[id]`
- [x] Customer analytics loads `customer_data`; Sales/Financial are permission-gated stubs

Parts C–F (upload pipeline, full strangler, decommission) are **out of scope** — see [docs/implementation-guide.md](docs/implementation-guide.md).

---

## Deploy portal to Vercel (now)

**Deploy only `portal/`.** Do not host `app/`, Docker, Postgres, or nginx on Vercel.

### 1. Project settings (critical)

| Setting | Value |
|---------|--------|
| Root Directory | `portal` |
| Framework Preset | **Next.js** (not Python) |
| Build / Install | defaults (`npm run build` / `npm install`) |

If the build says `No python entrypoint found` or `app.app:app`, the project is still on the **Python** preset (triggered by root `requirements.txt` / `app/`). Fix:

1. **Settings → General → Root Directory** → `portal` → Save
2. **Settings → General → Framework Preset** → **Next.js** (clear Python)
3. Redeploy

`portal/vercel.json` sets `"framework": "nextjs"` so the preset stays Next.js once Root Directory is `portal`.

### 2. Environment variables (Production)

Copy from [`.env.example`](.env.example). Recommended production:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Production** Clerk publishable key |
| `CLERK_SECRET_KEY` | **Production** Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `DATA_SOURCE` | `r2` |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET` | from Cloudflare R2 |
| `R2_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| `AWS_REGION` | `auto` |

Optional smoke test without R2: `DATA_SOURCE=local` and `DATA_ROOT=../data` (sample CSVs are traced into the serverless bundle). Prefer `r2` for real use.

### 3. Clerk dashboard

- Use a **production** Clerk application (or promote keys carefully).
- Paths: sign-in `/sign-in`, sign-up `/sign-up`.
- Add your Vercel URL under allowed origins / redirect URLs, e.g. `https://<project>.vercel.app` and `https://<project>.vercel.app/*`.
- Set pilot users’ `publicMetadata.permissions` per [docs/clerk-rbac.md](docs/clerk-rbac.md).

### 4. R2 objects (when `DATA_SOURCE=r2`)

Upload keys matching [`config/datasets.yaml`](config/datasets.yaml) (object path inside the bucket — not the bucket name):

- `data/customer_data.csv`
- `data/sales_data.csv`
- `data/financial_data.csv`

Example: bucket `no10assesment` + key `data/customer_data.csv`.

### 5. Deploy

**Dashboard:** Import the Git repo → Root Directory `portal` → set env vars → Deploy.

**CLI** (from repo root, after `npm i -g vercel`):

```bash
vercel link          # set Root Directory to portal when prompted (or in dashboard)
vercel env pull      # optional
vercel --prod        # or push to the connected git branch
```

`next.config.ts` sets `outputFileTracingRoot` + includes so repo-root `config/` (and sample `data/` for local mode) ship with the portal functions.
