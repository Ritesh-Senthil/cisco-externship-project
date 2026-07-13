# EventShield

Cisco EventShield — a live demo for the N.C. State Fair Division. Cross-domain readiness, incident correlation, playbook response, and human approval.

> Simulated data for demonstration purposes.

The demo answers: *Are we ready? What hidden dependency is failing? What will happen next? What should we do? Who must approve? Did the response work?*

```
Detect → Understand → Recommend → Approve → Act → Verify
```

## Quick start

```bash
# Requires Docker Desktop (Postgres, Redis, Splunk)
./scripts/demo_up.sh
```

Then open **http://localhost:3000**.

### Manual start

```bash
# 1. Infra
docker compose up -d postgres redis splunk

# 2. Backend (Python 3.12)
cd backend
source .venv/bin/activate   # or: python3 -m venv .venv && pip install -e .
uvicorn app.main:app --reload --port 8000

# 3. Frontend
cd frontend
npm install && npm run dev
```

| Service | URL |
|---|---|
| App | http://localhost:3000 |
| API | http://localhost:8000/api/health |
| Persistence | http://localhost:8000/api/persistence |
| Splunk Web | http://localhost:8001 (`admin` / `EventShield1!`) |

Copy `.env.example` → `.env` before the first run.

## Demo talk track (~8 min)

Presenter controls: **⌘⇧E** (scenario controller) · **⌘⇧D** (evidence drawer) · header **·** button

1. **Start Pre-Opening** — CONDITIONAL OPEN (~76), cascading Gate 1 risk
2. **Approve Plan** — scanners / backup / staffing recover → READY (~94)
3. **Advance to Live Event**
4. **Trigger Gate 1 Incident** — localized capacity collapse; Etix stays healthy
5. **Approve Plan** — watch CRITICAL → STABILIZING → RESOLVED
6. Open **Evidence** if asked how the engine reasoned

Full presenter guide: [docs/DEMO_MANUAL.md](docs/DEMO_MANUAL.md)

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind |
| Backend | FastAPI, Python 3.12 |
| Live state | In-memory scenario engine + WebSocket fanout |
| Persistence | PostgreSQL (best-effort) + Redis snapshot fanout |
| Telemetry | Splunk HEC (7 indexes, circuit-broken) |
| AI | Ollama (`qwen2.5:7b-instruct` recommended) or OpenAI-compatible API, with canned fallback |

## LLM wiring

In `.env`:

```bash
# Canned answers (demo-safe default — leave ON for presentations)
AI_FALLBACK_DEFAULT=true

# Live Ollama (recommended on Apple Silicon ≥16GB)
LLM_PROVIDER=ollama
LLM_MODEL=qwen2.5:7b-instruct
OLLAMA_BASE_URL=http://localhost:11434
LLM_TIMEOUT_SECONDS=18

# Or OpenAI-compatible API
# LLM_PROVIDER=openai
# LLM_MODEL=gpt-4o-mini
# OPENAI_API_KEY=sk-...
```

Toggle AI fallback from the scenario controller during the talk. When fallback is OFF, the backend calls the live model and falls back to canned answers on timeout.

```bash
ollama serve
ollama pull qwen2.5:7b-instruct
```

## Approve / Reject

Approval cards support **Approve Plan** and **Reject** only (no Modify UI). For the demo, approve the recommended plan.

## Docs

| Doc | Purpose |
|---|---|
| [docs/DEMO_MANUAL.md](docs/DEMO_MANUAL.md) | Presenter manual — flow, controls, Q&A, troubleshooting |
| [docs/IMPROVEMENTS.md](docs/IMPROVEMENTS.md) | Remaining setup checklist |
| [docs/SPLUNK_SETUP.md](docs/SPLUNK_SETUP.md) | HEC indexes and verification |
| [docs/EventShield_Demo_Design_Scope_Architecture.md](docs/EventShield_Demo_Design_Scope_Architecture.md) | Original design / architecture spec |

## Project layout

```
backend/app/          FastAPI — scenario, generators, readiness, forecast, AI, Splunk
frontend/src/         Next.js Command Center, Gate Detail, Incident, Timeline
scripts/              demo_up.sh, create_splunk_indexes.sh
splunk/               HEC defaults + index definitions
docs/                 Specs and presenter docs
```

## License

Demo / educational use. Simulated data only — no real fair, Etix, Amtrak, or Cisco device control.
