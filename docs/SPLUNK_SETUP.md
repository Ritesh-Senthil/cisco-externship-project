# Splunk setup for EventShield

## Prerequisites

1. Install **Docker Desktop** (required — no substitute for the Splunk container):

```bash
brew install --cask docker
open -a Docker
```

Wait until the whale icon shows Docker is running (`docker info` succeeds).

2. From the project root, copy env:

```bash
cp .env.example .env
```

## Start Splunk (and the stack)

```bash
docker compose up -d splunk
```

First boot takes **2–5 minutes**. Check:

```bash
docker compose logs -f splunk
```

When healthy:

| Service | URL / Port |
|---|---|
| Splunk Web | http://localhost:8001 |
| HEC | https://localhost:8088/services/collector |

**Login:** `admin` / `EventShield1!`  
**HEC token:** `eventshield-hec-token-change-me` (must match `.env`)

## Verify HEC

```bash
curl -k https://localhost:8088/services/collector \
  -H "Authorization: Splunk eventshield-hec-token-change-me" \
  -d '{"event":{"hello":"eventshield"},"sourcetype":"eventshield:synthetic"}'
```

Expected: `"text":"Success"`.

## Confirm EventShield indexes

After Splunk is up, create the demo indexes (required once):

```bash
./scripts/create_splunk_indexes.sh
```

In Splunk Web → **Settings → Indexes**, you should see:

- `eventshield_network`
- `eventshield_ticketing`
- `eventshield_transport`
- `eventshield_gate_ops`
- `eventshield_crowd`
- `eventshield_workflow`
- `eventshield_incidents`

If indexes are missing after first boot, re-run the script or restart once:

```bash
docker compose restart splunk
./scripts/create_splunk_indexes.sh
```

## Search demo events

After the backend is streaming:

```
index=eventshield_* earliest=-15m
| stats count by source sourcetype
```

Gate 1 wireless:

```
index=eventshield_network source=cisco_wireless
| table _time event.metrics.channelUtilization event.metrics.retryRate
```

## Full stack

```bash
docker compose up --build
```

App: http://localhost:3000  
API: http://localhost:8000/api/health  
Splunk: http://localhost:8001  

## Notes

- Splunk image is `linux/amd64` (runs under Docker Desktop emulation on Apple Silicon). Prefer allocating **≥4 GB RAM** to Docker.
- Backend HEC publish is **best-effort with a circuit breaker** — if Splunk is down, the live demo UI still works.
- Change `SPLUNK_PASSWORD` / `SPLUNK_HEC_TOKEN` in `docker-compose.yml`, `splunk/default.yml`, and `.env` together before a real presentation if you share the machine.
