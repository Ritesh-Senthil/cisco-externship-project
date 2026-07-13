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

## Already in good shape

- Scenario controller (⌘⇧E) and discreet header control
- Approve / Reject loop (no Modify UI)
- Synthetic seven-source streams
- Readiness, forecast, and cross-domain correlation
- Command Center, Gate 1 Detail, Active Incident, Timeline, Evidence drawer
- Dual LLM wiring (Ollama + OpenAI-compatible API) with canned fallback
- Splunk HEC dual-publish path with circuit breaker
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
