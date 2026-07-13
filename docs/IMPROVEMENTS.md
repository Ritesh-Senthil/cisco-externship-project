# EventShield — Remaining Setup & Improvements

Living checklist of work left after the initial scaffold. Ordered by presentation risk.

---

## Must finish before the presentation

1. **Wire Postgres + Redis for real**  
   Containers are up, but the app still keeps state in memory. Persist events, incidents, approvals, readiness snapshots, and scenario state to PostgreSQL. Use Redis for live pub/sub and current knobs/snapshot fanout.

2. **Confirm Splunk indexes in the UI**  
   HEC publish is succeeding. Verify events appear in Splunk Web (`index=eventshield_*`) and that `./scripts/create_splunk_indexes.sh` is part of the startup checklist. See [SPLUNK_SETUP.md](./SPLUNK_SETUP.md).

3. **LLM dry-run**  
   Start Ollama (or set an API key), pull/configure the model via `.env` (`LLM_PROVIDER`, `LLM_MODEL`, `OLLAMA_BASE_URL` / `OPENAI_*`), toggle AI fallback OFF once, and confirm timeout still falls back to canned answers.

4. **Full 8-minute rehearsal ×3**  
   Spec acceptance: full Detect → Understand → Recommend → Approve → Act → Verify flow succeeds three times in a row. Check Room Bar / TV layout (font sizes, controller reachability via ⌘⇧E and the header control).

5. **Prerecorded backup**  
   Screen-capture the happy path in case the live demo fails.

---

## Should improve (demo quality)

6. **UI polish to Catalyst patterns**  
   Stronger health-score treatment, clearer P1/P2 blocker cards, dependency-trace visual, smoother fairgrounds map status transitions. Keep Momentum-inspired controls and a restrained Cisco enterprise palette.

7. **Score / narrative tuning**  
   Pre-open is ~76 and post-fix ~95 (target story: ~78 → ~91). Lock exact talk-track numbers if verbatim values are required on screen.

8. **Recovery animation pacing**  
   Make the “8–12 minutes simulated” recovery feel right in real demo seconds (visible steps: success↑, queue↓, wireless↓, STABILIZING → RESOLVED).

9. **One-command demo start**  
   Add `scripts/demo_up.sh` that brings up Compose infra, backend, frontend, runs index check, and prints health URLs.

10. **Dress-rehearsal mode**  
    AI fallback ON by default, pause/resume streams, force recovery verified under presentation stress (CPU, Wi‑Fi, external display).

---

## Nice-to-have (not blocking)

11. Backend/frontend Docker images as the primary run path (today local `uvicorn` + `npm run dev` is the working path; Compose already defines the services).

12. Deeper Evidence drawer — rule IDs, per-source confidence, forecast inputs, playbook filter rationale.

13. Charts for queue / Wi‑Fi / validation success over the incident window.

14. Production-mapping slide content outside the app (Catalyst / Meraki / Splunk Enterprise / Webex mapping from the design spec).

---

## Cisco Catalyst Center integration (dual-plane) — IMPLEMENTED

> Status: shipped. Backend `integrations/catalyst.py` polls the sandbox on its own loop,
> the status rides in the snapshot, the LLM prompt is grounded with live Catalyst facts,
> and the Evidence drawer renders the provenance badge. Enable in hosted prod with the
> single env var `CATALYST_LIVE=true` (Northflank) — off by default everywhere else so
> local/offline demos never call out. Verify: `GET /api/admin/catalyst`.

Goal: add real Cisco credibility without disturbing the Gate 1 narrative. Instead of
replacing synthetic data, treat Catalyst Center as a second, real **plane** underneath
the existing scenario engine.

- **Control plane (real Catalyst).** The "venue network backbone." Poll live health,
  device inventory, and AI-driven issues from the DevNet Always-On sandbox. In the
  sandbox this reads ~healthy — which is exactly what the story wants: the backbone is
  fine, so the failure is localized.
- **Edge plane (synthetic, unchanged).** The Gate 1 scenario engine keeps driving the
  full arc (CONDITIONAL OPEN → incident → recovery). Demo flow does not change.

Because the narrative was always "localized problem, everything else healthy," a healthy
live backbone *reinforces* the story instead of contradicting it: "Catalyst Center
reports the venue backbone healthy; the degradation is isolated to the Gate 1 AP."

### Sandbox coordinates

| Item | Value |
|---|---|
| Base URL | `https://sandboxdnac.cisco.com` (backup: `sandboxdnac2.cisco.com`) |
| Credentials | `devnetuser` / `Cisco123!` |
| Cost / uptime | Free, 24/7, no reservation (shared box — occasional maintenance desyncs) |
| Auth | `POST /dna/system/api/v1/auth/token` (Basic Auth) → `{"Token": ...}`, 1-hour TTL, sent as `X-Auth-Token` header |
| TLS | Be ready to relax cert verification if the appliance presents a self-signed chain |

### Endpoints to pull

| Endpoint | Returns | Use |
|---|---|---|
| `GET /dna/intent/api/v1/issues?aiDriven=YES` | Cisco ML-flagged assurance issues (name, priority, category, rootCause, suggestedActions) | Insight *format/voice* + optional real blockers |
| `GET /dna/intent/api/v1/network-health` | Overall backbone health score by category | Live "backbone healthy" fact |
| `GET /dna/intent/api/v1/network-device` | Real device inventory (9300s, ASR, 3850) | Provenance badge + real asset IDs |
| `GET /dna/intent/api/v1/site-health`, `client-health` | Site / client health scores | Optional deeper evidence |

### Implementation plan

1. **New integration module** `backend/app/integrations/catalyst.py`, structured like
   `integrations/splunk.py`: token cache + refresh on `401`, `X-Auth-Token` calls,
   circuit breaker, timeout, and a `synthetic=False` marker so real vs. simulated data
   stays distinguishable.
2. **Background poll only.** Fetch on a tick and cache the last good response. Never
   block a UI request or the readiness engine on the sandbox.
3. **Feature flag** `CATALYST_LIVE` (default `false`, in `.env`), analogous to
   `AI_FALLBACK_DEFAULT`. Presenter toggles real Catalyst on only when the sandbox is
   confirmed healthy; if it is down, the badge greys out and the synthetic story is
   untouched.
4. **Provenance badge** in the Evidence drawer (⌘⇧D): "Cisco Catalyst Center —
   connected · token acquired · N devices managed," from a live `network-device` call.
   Highest credibility per effort; touches no scenario numbers.
5. **LLM grounding** — in `ai/orchestrator.py` `_build_context()`, append real facts
   (live network-health score, managed-device count, optionally one real `aiDriven`
   issue) next to the synthetic Gate 1 facts, so the model can truthfully contrast a
   healthy backbone with the localized Gate 1 degradation.
6. **Insight re-skin (optional)** — capture the real `aiDriven` issue object shape once
   and render the synthetic Gate 1 wireless blocker in that same Cisco Assurance
   vocabulary; optionally hydrate a genuine device hostname/serial so asset IDs are real.

### Resilience (non-negotiable for live demo)

Reuse the Splunk patterns: circuit breaker + short timeout, background poll with cached
last-good value, and the `CATALYST_LIVE` toggle for a clean offline fallback. The demo
must remain fully functional with the sandbox unreachable.

### Known limitation

The sandbox is a generic campus network with old inventory timestamps; it will not
produce the fair-specific arc. It serves as the "healthy backbone" / provenance layer,
not a replacement for the scenario engine. Pitch: *"EventShield rides on real Cisco
Catalyst Center telemetry for network truth, then correlates it cross-domain with venue
operations to catch the localized failure Catalyst alone wouldn't connect to ticketing,
transit, and crowd."*

---

## Already in good shape

- Scenario controller (⌘⇧E) and discreet header control
- Approve / Reject loop (no Modify UI)
- Synthetic seven-source streams
- Readiness, forecast, and cross-domain correlation
- Command Center, Gate 1 Detail, Active Incident, Timeline, Evidence drawer
- Dual LLM wiring (Ollama + OpenAI-compatible API) with canned fallback
- Splunk HEC dual-publish path with circuit breaker
- Cisco Catalyst Center live control-plane evidence (dual-plane, circuit-broken, `CATALYST_LIVE`)
- Docker Compose for Postgres, Redis, Splunk

---

## Suggested next sequence

1. Postgres / Redis wiring + one-command startup  
2. Splunk search verification  
3. LLM dry-run  
4. Timed rehearsal ×3 + backup recording  
5. UI polish and narrative tuning as time allows  

---

## Presenter quick reference

| Control | Action |
|---|---|
| ⌘⇧E | Scenario controller |
| ⌘⇧D | Evidence / dependency trace |
| Header **·** | Open scenario controller |
| **Approve Plan** | Intended demo path for readiness and incident |

Talk track: Start Pre-Opening → Approve Plan → Advance to Live Event → Trigger Gate 1 Incident → Approve Plan → watch recovery.
