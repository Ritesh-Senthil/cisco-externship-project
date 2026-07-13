# EventShield — Demo Manual

Everything a presenter needs to run the Cisco EventShield demo for the N.C. State
Fair Division: how to start it, every feature and control, the scripted flow, the
numbers to expect, likely audience scenarios with recommended responses, and
troubleshooting.

> **One-liner for the room:** *"EventShield connects the devices, services,
> transportation systems, and teams a major event depends on — it decides whether
> the event is ready, and during a disruption it correlates failures across
> domains, finds the cause, recommends an approved-playbook response, and verifies
> that it worked. Humans stay in command throughout."*

Every screen shows **"Simulated data for demonstration purposes."** Say this once
out loud early — it keeps the demo honest.

---

## 1. Quick start

### One command (recommended)

```bash
./scripts/demo_up.sh
```

This brings up the infra containers (Postgres, Redis, Splunk), ensures Splunk
indexes, starts the backend and frontend, waits for health, and prints URLs.

Then open **http://localhost:3000**.

### Manual start (if you prefer)

```bash
# 1. Infra (needs Docker Desktop running)
docker compose up -d postgres redis splunk

# 2. Backend
cd backend && .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000

# 3. Frontend
cd frontend && npm run dev -- --port 3000
```

### URLs and health

| What | URL |
|---|---|
| Demo app | http://localhost:3000 |
| API health | http://localhost:8000/api/health |
| Integrations health (PG/Redis/Splunk) | http://localhost:8000/api/persistence |
| Splunk Web | http://localhost:8001 (`admin` / `EventShield1!`) |

### Pre-flight checklist (do this 10 minutes before)

- [ ] `curl http://localhost:8000/api/health` returns `{"status":"ok"}`.
- [ ] App loads and header shows a green **Live** dot.
- [ ] Scenario controller opens (**⌘⇧E**).
- [ ] Run one full flow end-to-end once (see §4), then **Reset Demo**.
- [ ] If showing Splunk: a phase is active and `index=eventshield_* earliest=-15m | stats count by source` returns all 7 sources.
- [ ] If showing live AI: Ollama is running and warmed (ask one throwaway question), then decide fallback ON/OFF.
- [ ] Screen mirroring / projector resolution checked; controller reachable on the presentation display.

---

## 2. The interface

### Header / navigation
- **EventShield** logo, then four views: **Command Center · Gate 1 Detail · Active Incident · Timeline**.
- Right side: **Live/Reconnecting** status dot, an **Evidence** button, and a discreet **·** button (opens the scenario controller).

### Main views

**Command Center** — the home screen the audience sees most.
- **Event Readiness** panel: status chip (Ready / Conditional / Not Ready), big health score, confidence, demo clock, plain-language insight, and quick metrics (deps at risk, queue, predicted wait, trend).
- **Critical Blockers**: the top 3 risks, in plain language.
- **Fairground Zones**: simplified SVG map; Gate 1 / Transit Hub changes color with status and is clickable.
- **Active Incident** card (appears during an incident) with a link to the response.
- **Suggested questions**: click to ask the AI.
- **Recommended response** (pre-opening only): the readiness plan with **Approve Plan** / **Reject**.

**Gate 1 Detail** — the "device 360" drill-down: scanners online, validation
success, screening lanes, staffing, Wi-Fi, backup path, Etix health, signage, plus
queue estimate, predicted wait, arrival/processing rate, Amtrak and shuttle status.

**Active Incident** — incident summary, likely cause, affected dependencies,
confidence, and the ranked **Response plan** with **Approve Plan** / **Reject**.

**Timeline** — chronological log of everything that happened (phase changes,
approvals, incident, recovery), for the "what did we do and when" story.

### Hidden panels (presenter only)

| Control | Opens |
|---|---|
| **⌘⇧E** (Mac) / **Ctrl⇧E** | Scenario controller (bottom-left) |
| **⌘⇧D** / **Ctrl⇧D** | Evidence / dependency-trace drawer (right) |
| Header **·** button | Scenario controller |
| Header **Evidence** button | Evidence drawer |

**Evidence drawer** shows an *inspectable reasoning summary* (not hidden
chain-of-thought): the numbered reasoning steps, live domain scores, and the raw
normalized events with their metrics. This is your answer to "how does it actually
know that?"

---

## 3. The scenario controller (presenter controls)

Open with **⌘⇧E**. Buttons, grouped by how you'll use them:

**Scene setup / flow**
- **Reset Demo** — back to clean idle. Use between rehearsals.
- **Start Pre-Opening** — Scene 1. T-35 min, cascading conditional risk.
- **Apply Readiness Fixes** — applies the pre-open plan (same as clicking Approve on the card).
- **Mark Ready** — force READY state.
- **Advance to Live Event** — gates open, operations nominal.
- **Trigger Gate 1 Incident** — Scene 2. The live capacity collapse.
- **Approve Recovery** — approve the incident plan (same as the incident card).

**Safety / reliability**
- **Force Recovery** — instantly jump the incident to resolved (bail-out if the animation misbehaves live).
- **Toggle AI Fallback** — switch between canned answers (safe) and the live model.
- **Pause Streams** / **Resume Streams** — freeze/unfreeze the synthetic data.

The panel also shows current **Phase**, **AI fallback ON/OFF**, and **Streams
LIVE/PAUSED** so you always know your state.

> You can drive the whole demo from the on-screen **Approve Plan** buttons and the
> controller. The controller buttons and the card buttons are equivalent.

---

## 4. The scripted demo flow (~8 minutes)

The intended path, with what to say and what to expect on screen.

### Scene 1 — Pre-opening readiness (T-35 min)

1. **Controller → Start Pre-Opening.**
   - Status: **CONDITIONAL OPEN**, score **~76**, confidence High, 3 deps at risk.
   - Insight: *"Gate 1 is likely to fall below required entry throughput because scanner capacity, wireless headroom, backup connectivity, screening staffing, and incoming transportation demand are all marginal at the same time."*
   - **Talking point:** No single source has failed. A normal dashboard would show five separate yellow warnings. EventShield connects them into one event-level judgment.

2. *(Optional)* Click a **Suggested question**: "Why are we not ready?" / "What should we fix first?"

3. **Approve the Recommended response** (card on Command Center, or controller → Apply Readiness Fixes).
   - Recovery: scanners **17/20 → 19/20**, backup **Unverified → Verified**, staffing **Below plan → At plan**, score **~76 → ~94**, status **CONDITIONAL → READY TO OPEN**.
   - **Talking point:** Human approved; simulated actions changed real (synthetic) source state; the score reflects it.

4. **Controller → Advance to Live Event.** Gates open, operations nominal, still READY.

### Scene 2 — Live disruption response (T+60 min)

5. **Controller → Trigger Gate 1 Incident.**
   - An **Active Incident** appears: **Gate 1 localized capacity collapse**, severity **CRITICAL / ACTIVE**. Score drops to **~58 NOT READY**.
   - Cause: synchronized Amtrak + shuttle arrivals overlapping degraded scanner, wireless, and screening capacity.
   - **Key line:** *"Etix cloud services are healthy — so this is NOT a systemwide ticketing outage. It's a localized Gate 1 problem."* (This is the cross-domain reasoning payoff.)

6. Open **Active Incident** view. Walk the summary, likely cause, affected
   dependencies, and the ranked 7-action plan.

7. **Approve Plan.**
   - Incident moves **CRITICAL → STABILIZING → RESOLVED** over ~15–20 demo seconds.
   - Watch: scanner success ↑, queue ↓, predicted wait ↓, Wi-Fi ↓.

8. *(If asked)* Open the **Evidence drawer (⌘⇧D)** to show the reasoning steps,
   domain scores, and raw events. Open **Timeline** to show the full
   Detect → Understand → Recommend → Approve → Act → Verify loop.

9. **Controller → Reset Demo** when done.

### The loop, named
```
Detect → Understand → Recommend → Approve → Act → Verify
```

---

## 5. Response actions (the playbooks)

### Pre-opening plan — "Stabilize Gate 1 before opening" (Risk: Medium)

| Action | Owner | Expected impact |
|---|---|---|
| Move two mobile scanners to Gate 1 | Gate Ops | Scanner coverage 17/20 → 19/20 |
| Verify backup wireless failover | Network Ops | Backup path Unverified → Verified |
| Assign two additional screening staff | Security Ops | Staffing Below plan → At plan |
| Prepare alternate east gate for overflow | Fair Ops | Overflow path staged *(not auto-selected)* |

### Incident plan — "Restore Gate 1 entry capacity" (Risk: Medium, ETA 8–12 min)

| Action | Owner | Expected impact |
|---|---|---|
| Switch four mobile scanners to backup connectivity | Network Ops | Reduce scanner timeouts |
| Prioritize ticket-validation traffic | Network Ops | Improve validation success |
| Dispatch four additional staff | Gate Ops | Restore processing rate |
| Reopen the closed screening lane | Security Ops | Lanes 3/4 → 4/4 |
| Redirect next shuttle to alternate east gate | Transit Liaison | Cut Gate 1 arrival pressure |
| Update directional signage | Communications | Visitor redirect guidance live |
| Create simulated Webex incident room | Fair Ops Director | Cross-team coordination channel |

**Excluded by design** (say this if pushed on safety): gate closure, evacuation,
police dispatch, emergency announcements, ride shutdown. EventShield recommends
operational actions only; safety-critical decisions stay with humans.

---

## 6. Suggested AI questions

These appear as clickable buttons and are phase-aware.

**Before opening:** Why are we not ready? · What should we fix first? · What
happens if we open now? · Which team owns each blocker?

**During the incident:** What is causing the Gate 1 delay? · Is Etix down? · What
is the fastest safe response? · Why redirect the shuttle? · What happens if we do
nothing?

**AI modes (Toggle AI Fallback in the controller):**
- **Fallback ON (default, safe):** instant, curated canned answers. Use this if the
  network/laptop is under stress or you want zero surprises.
- **Fallback OFF (live):** calls the local Ollama model (`llama3.2`). Warm answers
  return in ~2–3s. If the model is slow or down, it automatically falls back to a
  canned answer — the demo never hangs.

The AI is constrained: it explains evidence and ranks approved playbook actions. It
**does not** compute the authoritative score, invent thresholds, override rules, or
make final safety decisions.

---

## 7. Example scenarios that may come up (and how to respond)

### A. Audience / stakeholder questions

**"Isn't this just a dashboard with more alerts?"**
> Show Scene 1. Point out that every source is only mildly degraded — a normal
> dashboard shows five yellow warnings and no verdict. EventShield's value is the
> single cross-domain judgment: *the combination* makes Gate 1 unready.

**"How does it know Etix isn't the problem?"**
> During the incident, open the Evidence drawer. Point to the line: *"Etix synthetic
> external test remained healthy."* The engine explicitly checks the external
> ticketing dependency and rules out a systemwide outage — that's why it classifies
> this as *local* capacity degradation.

**"Is the AI making the decision?"**
> No. The readiness score and status come from the deterministic engine (weighted
> domain scores + hard stops + forecast). The AI only explains and ranks
> approved-playbook actions, and a human must approve before anything executes.

**"Is this real data / real Cisco control?"**
> It's synthetic, streamed every 1–2 seconds, and clearly labeled. Nothing controls
> real devices. See the production-mapping table (design spec §21): in production,
> synthetic Cisco metrics map to Catalyst/Meraki/SD-WAN/ISE, the event bus to an
> enterprise streaming platform, simulated actions to approved connector actions,
> etc.

**"Where does the data actually go?"**
> Open Splunk (http://localhost:8001) and run `index=eventshield_* | stats count by
> source`. Every synthetic event is dual-published to the app and to Splunk HEC
> across seven indexes — real streaming integration, not a mockup.

**"What if two things fail at once / a different gate?"**
> The dependency model and correlation are Gate 1–focused for this demo, but explain
> the pattern: arrival surge + reduced screening + network degradation + scanner
> slowdown = localized capacity collapse. The same correlation logic generalizes.

### B. Things that can go wrong live (and your recovery)

| Symptom | Fast fix |
|---|---|
| Recovery animation stalls or looks off | Controller → **Force Recovery** (jumps to resolved). |
| Numbers jittering / audience distracted | Controller → **Pause Streams**, talk, then **Resume Streams**. |
| Live AI answer is slow or weird | Controller → **Toggle AI Fallback** (back to canned). |
| Score/status looks wrong mid-run | Controller → **Reset Demo** and restart the flow. |
| App shows "Reconnecting" | Backend dropped — restart it (§9); the UI auto-reconnects. |
| Splunk search empty | Make sure a phase is active (idle = no events) and time range is Last 15 min. |
| Anything unexplained | **Reset Demo** is always safe; then re-run from Start Pre-Opening. |

> **Golden rule:** if the live demo wobbles, **Reset Demo** and/or switch **AI
> Fallback ON**. Keep the prerecorded backup ready (IMPROVEMENTS #5).

---

## 8. The numbers to expect (talk-track reference)

| Phase | Score | Status |
|---|---|---|
| Pre-Opening | ~76 | CONDITIONAL OPEN |
| After Readiness Fixes | ~94 | READY TO OPEN |
| Live Event | ~92 | READY TO OPEN |
| Gate 1 Incident | ~58 | NOT READY |
| Recovering → Resolved | climbs back up | stabilizing → resolved |

Recovery deltas during Scene 2:
```
Scanner success: 76% → 89% → 98%
Queue:           480 → 405 → 320 → 255
Predicted wait:  22 min → 15 min → 9 min
Wi-Fi util:      94% → 86% → 74%
Incident:        CRITICAL → STABILIZING → RESOLVED
```

Values jitter within bounds tick-to-tick, but the causal story never changes.

---

## 9. Operations & troubleshooting

**Restart the backend**
```bash
lsof -ti :8000 | xargs kill -9 2>/dev/null || true
cd backend && .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*(Your shell has `errexit` on — always append `|| true` to `lsof ... | xargs kill`.)*

**Check all integrations at once**
```bash
curl -s http://localhost:8000/api/persistence
```
Shows `postgres_enabled`, `redis_enabled`, fail counts, and row counts. Everything
here is **best-effort** — if Postgres/Redis/Splunk are down, the live demo still
runs entirely in memory. They can never break the presentation.

**Splunk shows no events**
- Confirm indexes exist (Splunk Web → Settings → Indexes → the 7 `eventshield_*`).
- Confirm a phase is active (idle streams nothing).
- Note: the container runs a **Free license**, which disables the REST management
  port, so `create_splunk_indexes.sh` can't create indexes — create them in the Web
  UI, or switch `SPLUNK_LICENSE_URI: Free` → `Free-Trial` in `docker-compose.yml`
  and recreate the container + volume.

**Live AI (Ollama) falls back every time**
- Make sure Ollama is running: `ollama serve`, and the model exists: `ollama pull llama3.2`.
- Cold start is ~10s; the backend warms the model at startup and keeps it resident
  (`keep_alive`), with a 12s timeout. If you restarted Ollama, ask one throwaway
  question to warm it before going live.

**Port already in use**
```bash
lsof -ti :8000 || echo free    # backend
lsof -ti :3000 || echo free    # frontend
```

**Reset to a clean slate**
- Controller → **Reset Demo**, or `curl -X POST http://localhost:8000/api/admin/reset`.

---

## 10. Configuration (`.env`)

| Key | Purpose |
|---|---|
| `AI_FALLBACK_DEFAULT` | `true` = start in safe canned-answer mode |
| `LLM_PROVIDER` | `ollama` or `openai` |
| `LLM_MODEL` | e.g. `llama3.2` (Ollama) or `gpt-4o-mini` (OpenAI) |
| `LLM_TIMEOUT_SECONDS` | `12` — covers cold model load; warm answers ~3s |
| `OLLAMA_BASE_URL` / `OPENAI_API_KEY` | provider endpoints/credentials |
| `PERSISTENCE_ENABLED` | best-effort Postgres + Redis (safe to leave `true`) |
| `SPLUNK_ENABLED` | best-effort HEC publish |
| `DEMO_SEED` | deterministic synthetic randomization |

To use OpenAI instead of Ollama: set `LLM_PROVIDER=openai`, `OPENAI_API_KEY=sk-...`,
`LLM_MODEL=gpt-4o-mini`, then restart the backend.

---

## 11. Pre-presentation acceptance (from the spec)

The demo is "ready" only when the full **Detect → Understand → Recommend → Approve
→ Act → Verify** flow succeeds **three times in a row**, events appear in Splunk,
readiness updates automatically, the initial risk requires multiple dependencies,
Etix stays healthy while Gate 1 fails locally, recovery is visible, AI fallback
works, and Reset restores a clean scenario. Record one clean run as a backup.
```
Reset → Start Pre-Opening → Approve → Advance to Live Event
      → Trigger Gate 1 Incident → Approve → watch recovery → Reset
```
Run it three clean times. Then you're ready.
