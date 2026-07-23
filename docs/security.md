# Security controls for the paired session

Stack: **Vercel** (hosting) · **Clerk** (identity) · **Cloudflare R2** (objects).  
Aligned with [architecture.md](architecture.md). Docs only — no implementation in this repo.

---

## 1. UK / residency posture

| Control | Decision |
|---------|----------|
| App compute | Vercel project configured for **London (`lhr1`)** when available; avoid unnecessary multi-region fan-out |
| Object storage | Cloudflare R2 bucket with **EU jurisdiction** (document acceptance vs UK-only requirement with InfoSec) |
| Identity | Clerk instance/region and data-handling settings reviewed against departmental policy; prefer EU/UK-compatible configuration |
| Logs | Prefer EU/UK log sinks; avoid shipping analytics payloads to non-approved regions |
| Cross-region | No casual replication of curated datasets outside approved jurisdictions |

**Talking point:** the assessment requires UK-oriented hosting. This stack can be made *UK-leaning*; residual gaps (e.g. R2 EU vs UK-only) must be explicit, not hidden.

---

## 2. Authentication & authorisation (Clerk)

### AuthN

| Concern | Approach |
|---------|----------|
| Primary login | **Clerk** (passwordless/SSO as policy requires) |
| MFA | Enforced in Clerk for government users |
| Session | Clerk session via Next.js middleware; httpOnly cookies |
| Federation | Optionally connect departmental IdP to Clerk (SAML/OIDC) later |

### AuthZ

| Concern | Approach |
|---------|----------|
| Model | Clerk **Organizations** + **Roles** (or public/private user metadata) listing allowed `dashboard_id`s |
| Enforcement | Server Components / middleware / API routes check role before rendering or issuing R2 access |
| Catalogue | Home page lists only permitted dashboards (do not rely on “hide the link” alone) |
| Legacy | During strangler, map Clerk user → former Postgres permissions until Dash is retired |

### Leave behind

- Custom SHA256 password table as primary AuthN
- AuthZ only as ad-hoc checks deep inside each chart module

---

## 3. Secrets management

| Secret | Storage | Access |
|--------|---------|--------|
| Clerk keys | Vercel encrypted env (`CLERK_SECRET_KEY`, publishable key) | Server-only for secret; publishable in client as designed |
| R2 access keys | Vercel env or Cloudflare API tokens scoped to one bucket | Server-only; **never** in client bundles |
| Webhook secrets | Vercel env | Clerk webhook handler only |

**Do not:** commit `.env`; put R2 secrets in `NEXT_PUBLIC_*`; share long-lived keys with data scientists’ laptops (use presigned uploads instead).

**CI:** Vercel Git integration deploys with project env; GitHub Actions (if any) use OIDC/short-lived tokens — no static cloud keys in the repo.

---

## 4. Cloudflare R2 controls

| Control | Requirement |
|---------|-------------|
| Bucket | Private; no public access by default |
| Layout | `landing/` (uploads) → `curated/` (validated) per domain/dashboard |
| Upload | **Presigned PUT** from an authenticated API route — replaces emailing CSVs |
| Download | Presigned GET or server-side fetch with scoped credentials; short TTL |
| Validation | Schema/dtype checks before promoting landing → curated |
| Encryption | Encryption at rest (R2 default); TLS in transit |
| Least privilege | Separate tokens/permissions for portal upload vs dashboard read |
| Registry | Manifest maps `dataset_id` → R2 object key (versioned in Git or DB) |

**Lazy load:** dashboard routes request only their dataset IDs — never hydrate all CSVs into memory at process start.

---

## 5. Network & edge

- Users terminate TLS on **Vercel**
- Clerk-hosted auth pages / components as configured
- Security headers via Next.js config / Vercel (CSP carefully with Clerk + Plotly)
- API routes that mint R2 presigned URLs require an authenticated Clerk session
- Rate-limit upload and presign endpoints (Vercel firewall / WAF / app-level)

---

## 6. Audit & observability

| Signal | Source |
|--------|--------|
| Sign-in / MFA / failures | Clerk Dashboard / logs / webhooks |
| Who viewed which dashboard | App structured logs: `user_id`, `dashboard_id`, `timestamp` |
| Dataset access | Log presign/fetch events; optional R2 audit via Cloudflare logs |
| Deployments | Vercel deployment history + Git commit SHAs |
| Config changes | Clerk + Cloudflare audit logs |

Retain per departmental policy; keep PII out of client-side analytics where possible.

---

## 7. Paired-session one-pager

1. **Identity:** Clerk + MFA (+ optional IdP federation); kill password-primary auth.
2. **Residency:** Vercel London + R2 EU jurisdiction + Clerk settings — call residual risk.
3. **Secrets:** Vercel env only; R2 credentials server-side; presigned URLs for DS upload/read.
4. **Data:** landing → validate → curated R2; lazy per-dashboard fetch.
5. **Edge:** TLS on Vercel; authz on every catalogue/API route.
6. **Audit:** Clerk + app access logs + deployment provenance.

Maps to assessment criteria: *security*, *architecture*, *migration feasibility* (Phases 0–2 deliver the security and data-path wins before full Dash retirement).
