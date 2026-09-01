# Raspberry Pi deployment — frontend

Deploy the **backend repo first** — it creates the `life-tasks` Docker network
and runs Postgres + the API. See `life-tasks-backend/deploy/README.md` for the
one-time Pi setup (Docker, network, DNS, port-forwarding 80/443).

Caddy serves the built SPA and reverse-proxies `/api/*` to the `backend`
container. It obtains and renews the Let's Encrypt cert automatically.

## One-time

```bash
cd ~/life-tasks-frontend/deploy
cp .env.example .env && nano .env    # DOMAIN = the public hostname
```

## GitHub Actions secrets (this repo → Settings → Secrets → Actions)

| Secret                               | Value                                           |
| ------------------------------------ | ----------------------------------------------- |
| `PI_HOST` / `PI_USER` / `PI_SSH_KEY` | same as the backend repo                        |
| `VITE_AUTH0_DOMAIN`                  | Auth0 tenant domain                             |
| `VITE_AUTH0_CLIENT_ID`               | Auth0 SPA client id                             |
| `VITE_AUTH0_AUDIENCE`                | Auth0 API identifier (`https://api.life-tasks`) |

The `VITE_*` values are compiled into the bundle at build time, so they are
build args — changing one needs a rebuild (push to `main` or re-run the workflow).

## Auth0 dashboard

Applications → your SPA → Settings → add `https://<DOMAIN>` to:

- **Allowed Callback URLs**
- **Allowed Logout URLs**
- **Allowed Web Origins**

## Deploy

Push to `main` → build arm64 image → push to GHCR → SSH → `docker compose pull && up -d`.

Manual first run:

```bash
cd ~/life-tasks-frontend/deploy && docker compose up -d
docker compose logs -f frontend      # watch the cert get issued
```
