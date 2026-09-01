# Raspberry Pi deployment — frontend

Deploy the **backend repo first** — it creates the `life-tasks` Docker network,
runs Postgres + the API, and installs Tailscale (used only for CI SSH). See
`life-tasks-backend/deploy/README.md`.

The app is served at **https://lifetasks.today** through a **Cloudflare Tunnel**:
the `cloudflared` container makes an outbound connection to Cloudflare, so the Pi
needs no public IP and no router port forwarding. Cloudflare terminates TLS at
the edge and forwards to `http://frontend:80`, where Caddy serves the SPA and
proxies `/api/*` to the `backend` container.

```
lifetasks.today ──HTTPS──▶ Cloudflare edge ──tunnel──▶ cloudflared ──▶ frontend:80 (Caddy)
                                                                          ├─ /api/* ▶ backend:3000
                                                                          └─ /*     ▶ static SPA
```

## One-time — Cloudflare

1. Add `lifetasks.today` to Cloudflare (free plan) and switch the registrar's
   nameservers to the two Cloudflare gives you. Wait for it to go active.
2. Zero Trust dashboard → **Networks → Tunnels → Create a tunnel** → type
   `Cloudflared` → name it `life-tasks`.
3. On the **Install connector** screen, copy the token (the long string after
   `--token`). Don't run the shown command — the compose file runs the connector.
4. **Public Hostnames** tab → Add:
   - Subdomain: _(blank)_ · Domain: `lifetasks.today` · Service: `HTTP` `frontend:80`
   - (optional) Subdomain: `www` → same service, or a redirect rule
5. Cloudflare SSL/TLS mode: set to **Full** (Caddy speaks plain HTTP inside, TLS
   is edge-only — "Flexible" also works, "Full (strict)" does not).

## One-time — Pi

```bash
cd ~/life-tasks-frontend/deploy
cp .env.example .env && nano .env      # TUNNEL_TOKEN=<token from step 3>
docker compose up -d
docker compose logs -f cloudflared     # should report "Registered tunnel connection"
```

## GitHub Actions secrets (this repo → Settings → Secrets → Actions)

| Secret                                   | Value                                            |
| ---------------------------------------- | ------------------------------------------------ |
| `PI_HOST` / `PI_USER` / `PI_SSH_KEY`     | same as the backend repo (Pi MagicDNS name etc.) |
| `TS_OAUTH_CLIENT_ID` / `TS_OAUTH_SECRET` | same as the backend repo                         |
| `VITE_AUTH0_DOMAIN`                      | Auth0 tenant domain                              |
| `VITE_AUTH0_CLIENT_ID`                   | Auth0 SPA client id                              |
| `VITE_AUTH0_AUDIENCE`                    | Auth0 API identifier                             |

`TUNNEL_TOKEN` is **not** a CI secret — it lives in `deploy/.env` on the Pi.
The `VITE_*` values are compiled into the bundle at build time (build args), so
changing one needs a rebuild (push to `main` or re-run the workflow).

## Auth0 dashboard

Applications → your SPA → Settings → add `https://lifetasks.today` to:

- **Allowed Callback URLs**
- **Allowed Logout URLs**
- **Allowed Web Origins**

## Deploy

Push to `main` → build arm64 image → push to GHCR → join tailnet → SSH →
`docker compose pull && up -d`. The tunnel and its routes are configured in the
Cloudflare dashboard, so they survive redeploys untouched.

Manual redeploy:

```bash
cd ~/life-tasks-frontend/deploy && docker compose pull && docker compose up -d
```
