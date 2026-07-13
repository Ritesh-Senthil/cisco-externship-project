# Deploy EventShield on free tiers

Permanent free stack for the hosted demo, plus local Docker Splunk attached from any laptop.

## Architecture

| Piece | Free host | Notes |
|---|---|---|
| Frontend (Next.js) | [Vercel](https://vercel.com) Hobby | Root directory `frontend` |
| Backend (FastAPI) | [Northflank](https://northflank.com) Sandbox | Always-on; use [`backend/Dockerfile`](../backend/Dockerfile) |
| Postgres | Northflank free addon | Uses the 1 free database slot |
| Redis | [Upstash](https://upstash.com) Free | `rediss://` TLS URL |
| LLM | [Groq](https://console.groq.com) Free | OpenAI-compatible API |
| Cisco Catalyst Center | [DevNet Always-On sandbox](https://sandboxdnac.cisco.com) | Free 24/7; real read-only control-plane evidence (`CATALYST_LIVE=true`) |
| Splunk | Local Docker + Cloudflare Tunnel | No permanent free Splunk Cloud |

```
Browser → Vercel UI → Northflank API/WSS → Postgres + Redis + Groq
                         ↓ (after wire_splunk.sh)
              Cloudflare Tunnel → laptop Docker Splunk (:8001 Web / :8088 HEC)
```

## New laptop (presenter machine)

Cloud stack stays up. On any new computer:

1. Install **Docker Desktop** and start it.
2. Install **cloudflared**: `brew install cloudflare/cloudflare/cloudflared`
3. Clone this repo.
4. `cp .env.hosted.example .env.hosted` and set:
   - `EVENTSHIELD_API_BASE=https://api--eventshield-backend--nqtdqq6465jh.code.run`
   - `DEMO_ADMIN_TOKEN` (must match Northflank)
5. Run `./scripts/wire_splunk.sh` (leave running).
6. Open **https://eventshield-steel.vercel.app**  
   Splunk Web: http://localhost:8001 (`admin` / `EventShield1!`)

No local Postgres, Redis, Python backend, or `npm` required. If you skip Splunk, only step 6 is needed.

Presenter-oriented copy also lives in [DEMO_MANUAL.md](./DEMO_MANUAL.md) §1.

## 1. Backend on Northflank

1. Create a Sandbox project.
2. Add a **Postgres** addon; copy the connection string.
3. Create a combined service from this repo:
   - Build context / Dockerfile: `backend/Dockerfile`
   - Port: `8000`
   - Health check: `GET /api/health` (image includes a Docker `HEALTHCHECK`)
4. Set secrets (see also [`.env.example`](../.env.example) hosted section):

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://…` from the addon |
| `REDIS_URL` | Upstash `rediss://default:…@….upstash.io:6379` |
| `CORS_ORIGINS` | `https://YOUR-APP.vercel.app,http://localhost:3000` |
| `PERSISTENCE_ENABLED` | `true` |
| `LLM_PROVIDER` | `openai` |
| `OPENAI_BASE_URL` | `https://api.groq.com/openai/v1` |
| `OPENAI_API_KEY` | Groq key |
| `LLM_MODEL` | `llama-3.1-8b-instant` |
| `AI_FALLBACK_DEFAULT` | `true` |
| `LLM_TIMEOUT_SECONDS` | `18` |
| `SPLUNK_ENABLED` | `false` |
| `SPLUNK_HEC_TOKEN` | `eventshield-hec-token-change-me` |
| `CATALYST_LIVE` | `true` (lights up the live Cisco Catalyst Center badge) |
| `CATALYST_BASE_URL` | `https://sandboxdnac.cisco.com` |
| `DEMO_ADMIN_TOKEN` | long random secret (required for Splunk attach) |

Catalyst is read-only and best-effort: if the DevNet sandbox is unreachable the backend
degrades to a "Standby" badge and the synthetic scenario is unaffected. Sandbox
credentials (`devnetuser` / `Cisco123!`) are the built-in defaults, so `CATALYST_LIVE=true`
is the only variable required to enable it.

5. Note the public HTTPS URL (e.g. `https://….code.run` or your Northflank domain).

## 2. Frontend on Vercel

1. Import the GitHub repo → **Root Directory** = `frontend`.
2. Framework preset: Next.js.
3. Environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_BASE` | `https://YOUR-BACKEND` (no trailing slash) |
| `NEXT_PUBLIC_WS_URL` | `wss://YOUR-BACKEND/api/stream` |

4. Deploy. Open the Vercel URL and confirm the connection indicator is live.

## 3. Attach local Splunk from any machine

Cloud backends cannot reach `localhost` on your laptop. After clone on any computer:

```bash
# Prerequisites
# - Docker Desktop
# - cloudflared:  brew install cloudflare/cloudflare/cloudflared

git clone <this-repo> && cd cisco-externship-project
cp .env.hosted.example .env.hosted
# Edit .env.hosted:
#   EVENTSHIELD_API_BASE=https://YOUR-BACKEND
#   DEMO_ADMIN_TOKEN=<same as Northflank>

chmod +x scripts/wire_splunk.sh
./scripts/wire_splunk.sh
```

The script:

1. Starts only the `splunk` Compose service
2. Creates EventShield indexes
3. Opens a free Cloudflare quick tunnel to local HEC (`:8088`)
4. Calls `POST /api/admin/splunk/attach` on the cloud backend
5. Leaves the tunnel in the foreground — **Ctrl+C** detaches cleanly

Then open Splunk Web: http://localhost:8001 (`admin` / `EventShield1!`)

```
index=eventshield_* | stats count by index
```

Stop everything local:

```bash
./scripts/wire_splunk.sh --down
```

Fully local demo (no cloud) still works with `./scripts/demo_up.sh` — backend uses `SPLUNK_HEC_URL=https://localhost:8088/...` from `.env`.

## 4. Smoke checklist

- [ ] `curl -s https://YOUR-BACKEND/api/health` → `{"status":"ok",...}`
- [ ] `curl -s https://YOUR-BACKEND/api/persistence` → `postgres_enabled` / `redis_enabled` true
- [ ] `curl -s https://YOUR-BACKEND/api/admin/catalyst` → `"live":true` and (when the sandbox is up) `"connected":true` with a `device_count`; Evidence drawer (⌘⇧D) shows the Cisco Catalyst Center badge
- [ ] Vercel UI loads; WebSocket shows connected; scenario controller (⌘⇧E) advances phases
- [ ] AI fallback ON returns canned answers; toggle OFF once and confirm Groq (or fallback on timeout)
- [ ] `./scripts/wire_splunk.sh` → persistence shows `splunk_attached: true`, `splunk_enabled: true`
- [ ] After a few demo ticks, Splunk search `index=eventshield_*` returns events
- [ ] Ctrl+C wire script → `splunk_attached: false`; UI still works

## Notes

- HEC token defaults must stay aligned: `.env.example`, `docker-compose.yml`, `splunk/default.yml`, `.env.hosted.example`.
- Northflank Sandbox: 2 free services + 1 free addon — use the addon for Postgres; Redis stays on Upstash.
- Splunk Cloud has only a short free trial; local Docker + tunnel is the permanent free evidence path.
- Do not put the FastAPI app on Vercel — it needs a long-lived process, WebSockets, and the 1.5s demo loop.
