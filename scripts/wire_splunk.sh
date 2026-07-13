#!/usr/bin/env bash
# Attach local Docker Splunk to a cloud (or local) EventShield backend via Cloudflare Tunnel.
#
# Prerequisites: Docker Desktop, cloudflared, curl, python3
#
# Usage:
#   cp .env.hosted.example .env.hosted   # set EVENTSHIELD_API_BASE + DEMO_ADMIN_TOKEN
#   ./scripts/wire_splunk.sh
#   ./scripts/wire_splunk.sh --down      # stop tunnel, detach, stop Splunk container
#
# Leave this script running while you need Splunk evidence. Ctrl+C detaches cleanly.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DOWN=0
[[ "${1:-}" == "--down" ]] && DOWN=1

log() { printf "\033[1;36m[wire_splunk]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[wire_splunk]\033[0m %s\n" "$*"; }
err() { printf "\033[1;31m[wire_splunk]\033[0m %s\n" "$*" >&2; }

# Load hosted env if present, then fall back to .env
load_env_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  set -a
  # shellcheck disable=SC1090
  source "$f"
  set +a
}

load_env_file "$ROOT/.env"
load_env_file "$ROOT/.env.hosted"

API_BASE="${EVENTSHIELD_API_BASE:-http://localhost:8000}"
API_BASE="${API_BASE%/}"
ADMIN_TOKEN="${DEMO_ADMIN_TOKEN:-}"
HEC_TOKEN="${SPLUNK_HEC_TOKEN:-eventshield-hec-token-change-me}"
TUNNEL_LOG="${TMPDIR:-/tmp}/eventshield-cloudflared.log"
TUNNEL_PID=""

detach_and_cleanup() {
  local code=$?
  if [[ -n "$TUNNEL_PID" ]] && kill -0 "$TUNNEL_PID" 2>/dev/null; then
    kill "$TUNNEL_PID" 2>/dev/null || true
    wait "$TUNNEL_PID" 2>/dev/null || true
  fi
  if [[ -n "${API_BASE:-}" ]]; then
    log "Detaching Splunk from ${API_BASE}..."
    curl -sf -X POST "${API_BASE}/api/admin/splunk/detach" \
      ${ADMIN_TOKEN:+-H "X-Demo-Admin-Token: ${ADMIN_TOKEN}"} \
      >/dev/null 2>&1 || warn "Detach request failed (backend may already be down)."
  fi
  exit "$code"
}

if [[ "$DOWN" == "1" ]]; then
  log "Detaching + stopping local Splunk..."
  curl -sf -X POST "${API_BASE}/api/admin/splunk/detach" \
    ${ADMIN_TOKEN:+-H "X-Demo-Admin-Token: ${ADMIN_TOKEN}"} \
    >/dev/null 2>&1 || warn "Detach skipped."
  if command -v docker >/dev/null 2>&1; then
    docker compose stop splunk >/dev/null 2>&1 || true
  fi
  pkill -f "cloudflared tunnel --url https://127.0.0.1:8088" 2>/dev/null || true
  log "Done."
  exit 0
fi

# --- prerequisites ----------------------------------------------------------
if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
  err "Docker Desktop must be running."
  exit 1
fi
if ! command -v cloudflared >/dev/null 2>&1; then
  err "cloudflared not found. Install: brew install cloudflare/cloudflare/cloudflared"
  exit 1
fi
if [[ -z "${EVENTSHIELD_API_BASE:-}" && "$API_BASE" == "http://localhost:8000" ]]; then
  warn "EVENTSHIELD_API_BASE unset — attaching to local backend at ${API_BASE}"
fi

# --- Splunk container -------------------------------------------------------
log "Starting Splunk (docker compose)..."
docker compose up -d splunk
log "Ensuring EventShield indexes..."
./scripts/create_splunk_indexes.sh || warn "Index creation had issues; HEC may still work."

# Wait for HEC port
log "Waiting for local HEC on :8088..."
for i in $(seq 1 60); do
  if curl -sk -o /dev/null -w "%{http_code}" \
    -H "Authorization: Splunk ${HEC_TOKEN}" \
    https://127.0.0.1:8088/services/collector/health \
    | grep -Eq '200|400|401'; then
    log "HEC is reachable."
    break
  fi
  sleep 5
  if [[ "$i" -eq 60 ]]; then
    err "Timed out waiting for Splunk HEC."
    exit 1
  fi
done

# --- Cloudflare quick tunnel ------------------------------------------------
: > "$TUNNEL_LOG"
log "Opening Cloudflare quick tunnel to https://127.0.0.1:8088 ..."
# --no-tls-verify: Splunk HEC uses a self-signed cert
cloudflared tunnel --url https://127.0.0.1:8088 --no-tls-verify \
  >"$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!
trap detach_and_cleanup EXIT INT TERM

PUBLIC_BASE=""
for _ in $(seq 1 60); do
  if grep -Eo 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' "$TUNNEL_LOG" >/dev/null 2>&1; then
    PUBLIC_BASE="$(grep -Eo 'https://[a-zA-Z0-9.-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -1)"
    break
  fi
  if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
    err "cloudflared exited early. Log:"
    cat "$TUNNEL_LOG" >&2 || true
    exit 1
  fi
  sleep 1
done

if [[ -z "$PUBLIC_BASE" ]]; then
  err "Could not parse trycloudflare.com URL from cloudflared output."
  cat "$TUNNEL_LOG" >&2 || true
  exit 1
fi

HEC_PUBLIC="${PUBLIC_BASE}/services/collector"
log "Tunnel URL: ${PUBLIC_BASE}"
log "HEC URL:    ${HEC_PUBLIC}"

# --- Register with backend --------------------------------------------------
log "Attaching HEC to ${API_BASE} ..."
ATTACH_JSON=$(python3 - <<PY
import json
print(json.dumps({
  "hec_url": "${HEC_PUBLIC}",
  "hec_token": "${HEC_TOKEN}",
  "verify_ssl": False,
}))
PY
)

HEADERS=(-H "Content-Type: application/json")
if [[ -n "$ADMIN_TOKEN" ]]; then
  HEADERS+=(-H "X-Demo-Admin-Token: ${ADMIN_TOKEN}")
fi

RESP="$(curl -sS -X POST "${API_BASE}/api/admin/splunk/attach" \
  "${HEADERS[@]}" \
  -d "$ATTACH_JSON")" || {
  err "Attach failed. Is EVENTSHIELD_API_BASE correct and DEMO_ADMIN_TOKEN matching the server?"
  err "Response: ${RESP:-"(empty)"}"
  exit 1
}

echo "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('  attached=', d.get('splunk_attached'), 'host=', d.get('splunk_hec_host'), 'enabled=', d.get('splunk_enabled'))" \
  || echo "  raw: $RESP"

echo
log "Splunk is wired."
echo "  Splunk Web:  http://localhost:8001   (admin / EventShield1!)"
echo "  Search:      index=eventshield_* | stats count by index"
echo "  Status:      curl -s ${API_BASE}/api/persistence | python3 -m json.tool"
echo
log "Keep this terminal open. Ctrl+C detaches the tunnel from the backend."
log "To stop Splunk too: ./scripts/wire_splunk.sh --down"

# Block until tunnel dies or user interrupts
wait "$TUNNEL_PID" || true
