# Analytics Platform portal

Next.js App Router MVP (Parts A–B). Run from this directory.

See the [root README](../README.md) and [docs/mvp-playbook.md](../docs/mvp-playbook.md).

```bash
cp .env.example .env.local
# set Clerk keys; keep DATA_SOURCE=local and DATA_ROOT=../data
npm install
npm run dev
```

Dash WSGI under `../app` is **not** hosted on Vercel.
