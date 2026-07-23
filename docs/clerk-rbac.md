# Clerk RBAC for the Analytics Platform pilot

The Next.js portal (`portal/`) authorises dashboards and dataset APIs from
Clerk **public metadata**, not from the legacy Postgres password DB.

## Metadata shape (exact)

On each Clerk user, set:

```json
{
  "permissions": ["customer_analytics", "sales_dashboard", "financial_reports"]
}
```

- **Path the code reads:** `user.publicMetadata.permissions`
- **Type:** `string[]`
- **Where to set:** Clerk Dashboard → Users → [user] → Public metadata  
  (or Users API / Backend API when provisioning)

Unknown or missing `permissions` is treated as an empty list (no catalogue cards,
direct dashboard URLs return 403).

Permission string IDs must match `required_permission` in
[`config/dashboards.yaml`](../config/dashboards.yaml).

## Pilot users (mirror the Dash sample)

| Pilot (Clerk username / email you choose) | `publicMetadata.permissions` |
|-------------------------------------------|------------------------------|
| **admin** | `["customer_analytics", "sales_dashboard", "financial_reports"]` |
| **analyst1** | `["sales_dashboard", "financial_reports"]` |
| **scientist1** | `["customer_analytics"]` |

### Demo expectations

- **scientist1** — catalogue shows only Customer Analytics; Sales/Financial URLs → 403.
- **analyst1** — Sales + Financial stubs; Customer URL → 403.
- **admin** — all three cards; Customer loads data; Sales/Financial show “Not migrated yet”.

## How authorisation works in the portal

1. **Middleware** — unauthenticated requests to `/dashboards/*` and `/api/*` are redirected to sign-in.
2. **Catalogue** — cards filtered server-side by the user’s permission list.
3. **Dashboard pages** — server-side 403 if the required permission is missing (not CSS-only).
4. **Dataset API** (`GET /api/datasets/[id]`) — allowed only if the user has permission for **at least one** dashboard that lists that dataset in the manifest.

## Production notes

- Enable MFA for production Clerk instances.
- Prefer Organisations / custom roles later if the pilot grows; keep the same
  `permissions: string[]` contract in public metadata (or map org roles → that array in `lib/auth.ts`).
- Never put R2 or Clerk secret keys in `NEXT_PUBLIC_*` variables.
