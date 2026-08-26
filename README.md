# life-tasks-frontend

React + Vite + TypeScript PWA client for Life Tasks Manager. Talks to
[life-tasks-backend](../life-tasks-backend) — never to Postgres directly.

## Setup

```bash
pnpm install
pnpm dev
```

The dev server proxies `/api/*` to `http://localhost:3000` (see `vite.config.ts`),
so run `life-tasks-backend` alongside this.

## Status

Phase 1 scaffold: routing (`Today` / `Backlog` / `Calendar`) and a typed `api`
fetch wrapper are in place; pages call endpoints that don't exist on the backend
yet, so expect fetch errors until the corresponding API routes land.

PWA install/offline support (`vite-plugin-pwa`, configured in `vite.config.ts`)
is wired but unverified — `pwa-192x192.png` / `pwa-512x512.png` referenced in
the manifest still need to be added to `public/`.

## Scripts

- `pnpm dev` — dev server
- `pnpm build` — typecheck + production build
- `pnpm lint` — eslint
- `pnpm format` / `pnpm format:check` — prettier
