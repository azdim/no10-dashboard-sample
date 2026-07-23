# Assessment Focus — Parts A & B

Timeboxed path for the Cloud Platform Engineer assessment: **foundations + 1-hour MVP** on **Vercel · Clerk · Cloudflare R2**.

Full roadmap (C–F) stays in [implementation-guide.md](implementation-guide.md) for the paired-session “what next” narrative — you do **not** need to execute C–F in the assessment window.

| Part | Goal | Effort |
|------|------|--------|
| **A** | Accounts, secrets, contracts, Clerk RBAC model | ~30–45 min (mostly config / decisions) |
| **B** | Working Next.js portal: Clerk auth, RBAC catalogue, one lazy dataset | ~60 min |

**One-sentence story:** *“Clerk-protected Next.js catalogue on Vercel with a manifest-driven lazy data path to R2 (local CSV in dev).”*

---

## Part A — Foundations checklist

Work top to bottom. Tick before starting B.

### A1. Decisions (write down — paired session evidence)

- [ ] Stack locked: Vercel + Clerk + R2 (not AWS)
- [ ] UK-leaning: Vercel London (`lhr1` when available), R2 **EU** jurisdiction, Clerk residency reviewed
- [ ] Residual residency risk called out (R2 EU ≠ UK-only) — see [security.md](security.md)
- [ ] Owners: platform = portal/auth/R2; DS = dashboard modules/datasets

### A2. Provision (or note “would provision”)

If you lack live accounts in the assessment, document the exact resources below and use **local mocks** in B (`DATA_SOURCE=local`).

| Service | Create | Name / note |
|---------|--------|-------------|
| Clerk | App + Dev/Prod instances | MFA on for prod |
| Cloudflare R2 | Bucket, EU jurisdiction | e.g. `analytics-curated-eu` |
| Vercel | Project linked to GitHub | Region → London if available |
| GitHub | Portal repo | No hand-copy into Dash monolith |

### A3. Env var contract

| Variable | Where | Secret? |
|----------|--------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel + local | No |
| `CLERK_SECRET_KEY` | Vercel + local | Yes |
| `R2_ACCOUNT_ID` | Vercel + local | Prefer yes |
| `R2_ACCESS_KEY_ID` | Vercel + local | Yes |
| `R2_SECRET_ACCESS_KEY` | Vercel + local | Yes |
| `R2_BUCKET` | Vercel + local | No |
| `DATA_SOURCE` | `local` \| `r2` | No |

- [ ] `.env.example` lists names only (no values committed)
- [ ] No R2 keys under `NEXT_PUBLIC_*`

### A4. Manifests (IDs match sample Dash app)

**Dashboards** (permissions align with sample repo):

| id | path | required_permission | datasets |
|----|------|---------------------|----------|
| `customer_analytics` | `/dashboards/customer-analytics` | `customer_analytics` | `customer_data` |
| `sales_dashboard` | `/dashboards/sales-dashboard` | `sales_dashboard` | `sales_data` |
| `financial_reports` | `/dashboards/financial-reports` | `financial_reports` | `financial_data` |

**Datasets:**

| dataset_id | local_path | r2_key |
|------------|------------|--------|
| `customer_data` | `customer_data.csv` | `curated/customer/customer_data.csv` |
| `sales_data` | `sales_data.csv` | `curated/sales/sales_data.csv` |
| `financial_data` | `financial_data.csv` | `curated/financial/financial_data.csv` |

- [ ] Manifest IDs written (YAML/JSON in repo or pasted in architecture notes)

### A5. Clerk pilot users (mirror sample)

| Pilot | Entitlements |
|-------|----------------|
| admin | all three permissions |
| analyst1 | `sales_dashboard` + `financial_reports` |
| scientist1 | `customer_analytics` only |

- [ ] Roles/permissions created in Clerk (or documented if account unavailable)
- [ ] MFA policy noted for production

**Part A exit:** You can explain residency, secrets, and “scientist1 sees only Customer” without the Postgres password DB.

---

## Part B — 1-hour MVP build order

Stay ruthless: **one** catalogue, **one** guarded API, **one** dashboard page + dataset. Do not strangle all three Dashboards.

### Minute 0–10 — Scaffold

1. Create Next.js app (App Router, TypeScript).
2. Push to GitHub; connect Vercel; confirm a deploy.
3. Home page title: “Analytics Platform”.

### Minute 10–25 — Clerk

1. Install Clerk Next.js SDK; add middleware on `/dashboards(.*)` and `/api(.*)`.
2. Sign-in route working.
3. Prove: logged-out user → redirected; logged-in → OK.

### Minute 25–40 — Catalogue + RBAC

1. Load dashboard manifest.
2. Resolve Clerk roles/metadata → permission set.
3. Render only allowed cards.
4. Server-side deny on direct URL if permission missing (not CSS-only).

**Demo script:** sign in as scientist1 → only Customer card; as admin → all three.

### Minute 40–55 — Lazy dataset path

1. `GET /api/datasets/[id]` (or `/presign`):
   - require Clerk session
   - resolve `id` via dataset manifest
   - allow only if user can access a dashboard that lists that dataset
   - `DATA_SOURCE=local` → read `data/*.csv`; `r2` → short-TTL presigned GET or server fetch
2. Stub page `/dashboards/customer-analytics`: call API, show row count or one simple chart (Plotly.js optional).

### Minute 55–60 — Polish for paired session

1. Screenshot or live: login → filtered catalogue → customer data loads.
2. Say the one-sentence story (above).
3. Point at [architecture.drawio](architecture.drawio) for C–F (“next we’d upload to R2 landing→curated, then strangle Sales/Financial”).

**Part B exit checklist**

- [ ] Vercel (or local) app runs
- [ ] Clerk required for `/dashboards`
- [ ] Catalogue filtered by role
- [ ] One dataset loads on demand (not “all CSVs at startup”)
- [ ] Story maps to draw.io: Users → Vercel → Clerk → lazy → R2/local

---

## What you say in the paired session (A+B only)

1. **Problem:** monolith merge, email CSV, memory dump, weak auth — keep DX, unified UI, RBAC.
2. **Target:** draw.io — Vercel portal, Clerk, R2.
3. **Done today:** Part A contracts + Part B shell (auth, catalogue, lazy load).
4. **Not done (honest):** R2 upload pipeline, strangling all Dash pages, decommission ECS — Parts C–F.
5. **Why not Dash on Vercel:** long-lived WSGI ≠ serverless; strangler to Next/Plotly.js.

---

## Explicit non-goals for this focus

- Implementing Parts C–F (coexistence, full R2 publish, multi-dashboard strangler, decommission)
- AWS / ECS / Terraform
- Rewriting the existing Python Dash sample in-place as the production host

When A+B are solid, return to [implementation-guide.md](implementation-guide.md) Parts C–F for delivery planning.
