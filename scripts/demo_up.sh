#!/usr/bin/env bash
# EventShield one-command demo startup.
# Brings up Compose infra (Postgres/Redis/Splunk), ensures Splunk indexes,
# starts the backend + frontend locally, and prints health URLs.
#
#   ./scripts/demo_up.sh          # full stack (infra + app)
#   ./scripts/demo_up.sh --no-infra   # skip docker, just run app processes
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WITH_INFRA=1
[[ "${1:-}" == "--no-infra" ]] && WITH_INFRA=0

log() { printf "\033[1;36m[demo_up]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[demo_up]\033[0m %s\n" "$*"; }

# --- 0. env ----------------------------------------------------------------
if [[ ! -f .env ]]; then
  log "Creating .env from .env.example"
  cp .env.example .env
fi

# --- 1. infra (Postgres / Redis / Splunk) ----------------------------------
if [[ "$WITH_INFRA" == "1" ]]; then
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    log "Starting Postgres, Redis, Splunk via Docker Compose..."
    docker compose up -d postgres redis splunk
    log "Ensuring Splunk indexes (waits for management port)..."
    ./scripts/create_splunk_indexes.sh || warn "Splunk index creation skipped/failed (demo still works)."
  else
    warn "Docker not running — skipping infra. App runs in-memory (Splunk/PG/Redis off)."
  fi
else
  log "Skipping infra (--no-infra)."
fi

# --- 2. backend ------------------------------------------------------------
log "Starting backend (uvicorn :8000)..."
( cd backend
  if [[ ! -d .venv ]]; then
    python3 -m venv .venv
    ./.venv/bin/pip install -q -e .
  fi
  lsof -ti :8000 | xargs kill -9 2>/dev/null || true
  nohup ./.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 > "$ROOT/backend.log" 2>&1 &
)

# --- 3. frontend -----------------------------------------------------------
log "Starting frontend (next :3000)..."
( cd frontend
  [[ -d node_modules ]] || npm install
  lsof -ti :3000 | xargs kill -9 2>/dev/null || true
  nohup npm run dev -- --port 3000 > "$ROOT/frontend.log" 2>&1 &
)

# --- 4. health -------------------------------------------------------------
log "Waiting for backend health..."
for _ in $(seq 1 30); do
  if curl -sf http://localhost:8000/api/health >/dev/null 2>&1; then break; fi
  sleep 1
done

echo
log "EventShield is coming up:"
echo "  App:          http://localhost:3000"
echo "  API health:   http://localhost:8000/api/health"
echo "  Persistence:  http://localhost:8000/api/persistence"
echo "  Splunk Web:   http://localhost:8001   (admin / EventShield1!)"
echo "  Logs:         backend.log  frontend.log"
echo
log "Presenter: open the app, press Cmd/Ctrl+Shift+E for the scenario controller."
