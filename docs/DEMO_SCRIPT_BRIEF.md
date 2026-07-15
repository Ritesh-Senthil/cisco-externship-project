# CaroSHIELD Demo Script Brief

**Purpose:** Hand this document to another LLM (or presenter) to write a spoken demo script.  
**Do not invent new product features.** Stick to what exists in the app and what this brief confirms.  
**Today’s date context:** July 2026 · Cisco HS Capstone / Externship · Team **Cardinal Collective LLC**

---

## 1. Project & audience

| Item | Detail |
|---|---|
| Team | Cardinal Collective LLC — Joanna Arul Jeeva, Hansika Boggavarapu, Bineet Sahoo, Brecken O’Leary, Grant Gunnels, Ritesh Senthil |
| Client org | North Carolina State Fair (NCDA&CS), Raleigh |
| Product name | **CaroSHIELD** (UI title: CaroSHIELD · N.C. State Fair; some docs still say EventShield) |
| Role | Cisco consulting team helping the fair modernize safely with AI |
| Judges | Cisco HS Capstone evaluators — score against the official rubric below |
| Demo length | **7 minutes** (hard cap) |
| App | Single-page Next.js demo at `/` (hosted: `https://eventshield-steel.vercel.app` or local `http://localhost:3000`) |

---

## 2. Official requirements (must hit)

### Capstone objectives

- **A)** Choose an organization → **N.C. State Fair** (done).
- **B)** Identify **two AI use cases** → must be **named out loud** in the demo:
  1. **Event Readiness** — fuses marginal signals across domains into one opening verdict.
  2. **Crowd & Operations AI** — correlates crowd surges + operational failures into ranked playbook actions.
- **C)** Propose how **Cisco technology** enables the transition with focus on **security & ethics**.

### Solution Approach lenses

| Lens | What judges listen for | Where we hit it |
|---|---|---|
| **Technical** | Solution leverages Cisco technology | Demo: Cisco fabric panel + Webex in incident plan; Slide 6 expands |
| **Value** | Quantify impact; tangible business success metrics | Demo: speak 1–2 numbers from business impact strip; Slides 9–13 expand |
| **Security & Ethics** | AI risks: data privacy, copyright, job displacement, LLM vulnerabilities, etc. | Demo: human approve + playbook-only + no unsafe actions; Slide 7 SHIELD expands |
| **Sustainability** | Resources required; deploy options (pre-trained / curated vs live; cloud/on-prem/hybrid) | Demo: “Curated” AI + Year-1 shadow/decision-support on existing infra; Slide 8 expands |

### Evaluation rubric (100 points)

| Criteria | Points | Details |
|---|---|---|
| Innovation | 30 | Creativity/originality; innovation in technology |
| Technical Feasibility | 25 | Technical soundness; **use of Cisco technologies**; **AI integration** |
| Impact and Relevance | 20 | Problem addressed; industry relevance; long-term benefits |
| Implementation Plan | 15 | Clear roadmap; scalability; resource utilization |
| Presentation and communication | 10 | Clarity; engagement; **team collaboration** |

---

## 3. Presentation flow (deck context)

Demo sits **after Slide 5** and **before Slide 6**.

| Slide | Owner / time | Role relative to demo |
|---|---|---|
| 1–2 | Everyone | Intro + team |
| 3 | Banish | NC State Fair context (946,811 visitors 2025; $10M+ revenue) |
| 4 | Hansika | Mission alignment (fair + Cisco) |
| 5 | Grant | Operations ecosystem → **blind spot** → queue into demo |
| **DEMO** | **7 min** | Prove one shared picture + two use cases + loop |
| 6 | Banish ~1 min | Full Cisco tech (demo only seeds this) |
| 7 | Joanna & Grant ~1.5 min | SHIELD security & ethics (demo only seeds this) |
| 8 | Joanna ~30s | Year 1–4 adoption roadmap |
| 9 | — | Budget |
| 10–13 | — | Success metrics |
| 14 | — | Closing |

### Slide 5 story the demo must pay off

- Fair systems (parking, tickets, Wi-Fi, payments, cameras, security) are monitored **separately**.
- No single real-time view of whether the event is ready and safe → **operational blind spot**.
- Cascade: Wi-Fi issue → scanner failures → longer lines → congestion → worse safety/experience/revenue.
- **CaroSHIELD closes this blind spot.** Demo shows what that looks like.

### Closing claims the demo should support (Slide 14)

- Innovative: two connected predictive AI use cases (readiness + crowd/ops).
- Feasible: existing systems + Cisco networking, security, observability, identity, collaboration, AI protection.
- Impactful: wait times, outages, crowd safety, response, visitor experience, resilience.
- Scalable: shadow mode → prove → scale; annual fair + year-round events.
- Humans keep control; CaroSHIELD gives shared picture, earlier warnings, more time to act.

---

## 4. What exists in the demo (product facts)

### Views (header nav)

**Ops:** Command · Gate 1 · Incident · Timeline  
**Arch (skip in main demo):** Production · Demo stack  

### Always-on

- Banner: simulated / demonstration data — **say once early**.
- **ResponseLoop** stepper on ops views: Detect → Understand → Recommend → Approve → Act → Verify.
- Overlays: Evidence (⌘⇧D), Scenario Controller (⌘⇧E or header ·).

### Phases

`idle` → `pre_opening` → `fixes_applied` → `ready` → `live_event` → `incident` → `recovering` → `resolved`

### Scene 1 — Pre-opening (Use case 1)

- Controller: **Start Pre-Opening**
- Expect: score **~76 CONDITIONAL**, High confidence, **3 deps at risk**
- Insight: Gate 1 likely below required entry throughput because scanner capacity, wireless headroom, backup connectivity, screening staffing, and incoming transportation demand are all marginal **at the same time**
- Recommended plan: **“Stabilize Gate 1 before opening”** (Medium risk)
  - Selected: move scanners; verify backup wireless; assign screening staff
  - Unselected: prep east gate overflow
- On **Approve Plan**: scanners 17→19, backup Unverified→Verified, staffing Below plan→At plan, score **~76 → ~94 READY**
- Then: **Advance to Live Event**

### Scene 2 — Live incident (Use case 2)

- Controller: **Trigger Gate 1 Incident**
- Title: **Gate 1 localized capacity collapse**
- UI eyebrow: **Use case 2 · Crowd & Operations AI**
- Severity CRITICAL / ACTIVE; score ~**58 NOT READY**
- Cause: synchronized Amtrak + shuttle arrivals overlapping degraded scanner, wireless, and screening capacity
- **Key fact: Etix cloud services remain healthy** — not a systemwide ticketing outage
- Plan: **“Restore Gate 1 entry capacity”** (~7 ranked actions, Medium risk, ETA ~8–12 min), including Webex incident room, shuttle redirect, signage, scanners/staff/lanes
- Safety: **never** recommends gate closure, evacuation, police, emergency announcements, ride shutdown
- On **Approve Plan**: CRITICAL → STABILIZING → RESOLVED over **~15–20 demo seconds**; metrics recover

### AI copilot (Command Center)

- Labels both use cases explicitly (“Two use cases”).
- Phase-aware suggested questions.
- Badge: **Curated** (fallback ON) vs **Live model** (fallback OFF).
- **Keep AI Fallback ON** for the presentation (safe canned answers).
- AI explains / ranks playbook actions only — does **not** own the authoritative score or final safety decisions.

### Cisco fabric panel (Command Center)

Products shown with status: Catalyst Center · Meraki Wireless · SD-WAN · ThousandEyes · Splunk · Cisco ISE · Duo MFA · Webex · Cisco XDR · AI Defense  

### Business impact strip

Illustrative metrics (e.g. revenue at risk, loss avoided, throughput gap, guests delayed). **Speak numbers aloud**; ideally align with Slides 10–13 when those exist.

### Presenter controls (⌘⇧E)

Reset Demo · Start Pre-Opening · Apply Readiness Fixes · Mark Ready · Advance to Live Event · Trigger Gate 1 Incident · Approve Recovery · Force Recovery · Toggle AI Fallback · Pause/Resume Streams  

Approve on-card ≡ Apply Readiness Fixes / Approve Recovery in controller.

### Explicitly OUT of the main 7-minute path

- Gate 1 Detail deep tour  
- Production Architecture walkthrough  
- Demo Architecture tab (keep as Q&A bailout only)  
- Live Splunk Web UI (optional if asked and wired)  
- Live LLM (fallback OFF)  
- Third scenario  

---

## 5. Confirmed demo flow (authoritative timing)

**Screen start:** Command Center · AI Fallback **ON** · controller ready  

### 0:00–0:25 — Frame

- Say simulated data once.
- Name client: N.C. State Fair.
- **Name both AI use cases out loud** (Event Readiness; Crowd & Operations AI).
- Point at AI copilot “Two use cases” panel if visible.

### 0:25–1:30 — Scene 1 setup (Event Readiness)

- **Start Pre-Opening**
- Hit: ~76 CONDITIONAL, insight, blockers, map Gate 1, ResponseLoop
- **Speak one business number** (guests delayed / revenue at risk)
- Line: many yellows → one event-level judgment (closes Slide 5 blind spot)

### 1:30–1:50 — Cisco seed

- Point at **Cisco fabric** panel (do not open Architecture)
- Name **~4–5 products** (e.g. Meraki, Splunk, Duo/ISE, Webex, AI Defense) — not all ten
- Line: Slide 6 covers the stack; this is the live picture those products feed

### 1:50–2:50 — Approve readiness

- Show plan title + selected actions
- **Approve Plan**
- Lines: approved playbook only; human approves; no autonomous open/close
- Watch ~76 → ~94 READY
- Optional: value beat on wait/throughput/revenue protected before open

### 2:50–3:10 — Bridge

- **Advance to Live Event**
- Line: gates open; now Use case 2

### 3:10–4:50 — Scene 2 (Crowd & Operations AI)

- **Trigger Gate 1 Incident** → open **Incident** view
- Name Use case 2 out loud
- Hit: CRITICAL title, cause, **Etix healthy**, plan, safety callout
- Call out **Webex** if listed in plan actions (Cisco as action, not just telemetry)
- **Recommended add if time:** click one AI suggested question (e.g. “Is Etix down?”) while Curated — proves AI integration

### 4:50–6:10 — Approve + verify

- **Approve Plan**
- Watch CRITICAL → STABILIZING → RESOLVED
- Same loop: Recommend → Approve → Act → Verify
- **Speak recovery business metric** (wait/queue down or loss avoided)
- Humans stay in control; system bought time

### 6:10–6:45 — Close + handoff

- Optional ≤20s: **Evidence** (⌘⇧D) **or** **Timeline** (not both)
- Sustainability seed: Year One **shadow / decision-support** on existing scanners, Wi-Fi, ops data — prove then scale
- Long-term seed (optional): same picture can extend to year-round fairgrounds events
- Handoff: “Next — Cisco technologies” → **Slide 6**

### 6:45–7:00 — Buffer

- Reset after handoff; **Force Recovery** if animation stalls

---

## 6. Must-say lines (do not drop)

1. “**Two AI use cases: Event Readiness, and Crowd & Operations.**”
2. “**Meraki / Splunk / Duo / Webex / AI Defense** feed this picture.” (subset of fabric OK)
3. “**Humans approve; playbooks only — no autonomous gate closure.**”
4. One **business number** before open + one after recovery (align with metrics slides if possible).
5. “**Etix is healthy** — localized Gate 1, not a systemwide ticket failure.”
6. “**Year One: shadow / decision support** on existing infrastructure.”

### Strongly recommended extras (rubric insurance)

7. Click **one** AI suggested question + say the badge is **Curated** (controlled answers for demo / Year-1 style).
8. Name **Webex incident room** on the incident plan.
9. **Two-person delivery** if possible: one drives controller, one narrates (team collaboration points).

---

## 7. Rubric coverage map

| Checkbox | Demo | Later slides |
|---|---|---|
| A Organization | Named in open | 1–5 |
| B Two AI use cases | Named + UI labels + Scene 1 / Scene 2 | Closing |
| C Cisco + security/ethics | Fabric + Webex + human/playbook lines | 6 + 7 SHIELD |
| Technical / Cisco | Fabric seed + Webex | 6 |
| AI Integration | Copilot + optional question click | — |
| Value / metrics | Spoken business impact | 9–13 |
| Security & Ethics | Approve twice + safety exclusions | 7 full SHIELD + NIST |
| Sustainability | Curated + shadow mode + reuse infra | 8 (+ hosting detail if added) |
| Implementation | Seed only | 8–9 |
| Innovation | Cascade + Etix correlation | Whole story |
| Presentation | Clear timed path; prefer dual presenters | Whole deck |

---

## 8. SHIELD (Slide 7 — demo only seeds; script may preview lightly)

Demo should **not** lecture SHIELD. One human-oversight line is enough. Full principles for post-demo slide:

| Letter | Meaning |
|---|---|
| S | Secure Infrastructure — Zero Trust, Duo MFA, encryption, segmentation; NIST CSF |
| H | Human Oversight — AI recommends; trained official approves |
| I | Input and Model Protection — Cisco AI Defense (prompt injection, leakage, etc.); AI isolated from physical controls |
| E | Ethical Data Use — anonymous/aggregated crowd & ops data; NIST Privacy |
| L | Licensed Data Only — approved fair/vendor/weather/ops data |
| D | Decision Support — replaces repetitive monitoring, not staff judgment |

---

## 9. Script-writing instructions for the LLM

Write a **spoken presenter script** for the **7-minute demo only** (not the full deck), unless asked otherwise.

### Requirements for the output script

- Follow **Section 5 timing** and **Section 6 must-say lines**.
- Include stage directions: `[CLICK: Start Pre-Opening]`, `[POINT: Cisco fabric]`, `[CLICK: Approve Plan]`, etc.
- Include expected on-screen numbers (~76, ~94, Etix healthy, CRITICAL→RESOLVED).
- Mark optional beats clearly (AI question, Evidence vs Timeline).
- Assume **AI Fallback ON**.
- Do **not** script Gate Detail, Architecture tabs, or Splunk as required path.
- Prefer a **narrator + driver** format if writing for two people; otherwise single-presenter with click cues.
- Tone: consulting demo for Cisco judges — clear, confident, not hypey; honest about simulation.
- Keep total spoken length realistic for **7 minutes** including pauses for animations (~15–20s recovery).
- End with an explicit handoff sentence to **Slide 6 — Cisco Tech**.

### What not to invent

- Do not invent Cisco products not listed in the fabric panel.
- Do not invent a third use case.
- Do not claim the AI closes gates, evacuates, or acts without approval.
- Do not claim live Meraki/Duo device control unless stating UI status mapping.
- Do not spend demo time on full Year 1–4, budget, or full metrics tables.

### Reference docs in repo (optional depth)

- `docs/DEMO_MANUAL.md` — presenter bible, exact copy, Q&A
- `README.md` — short talk track
- Frontend: `CommandCenter.tsx`, `IncidentView.tsx`, `AiCopilot.tsx`, `CiscoTechPanel.tsx`, `ScenarioController.tsx`

---

## 10. One-liner (room)

> CaroSHIELD gives the N.C. State Fair one real-time picture of readiness and live operations — two AI use cases that correlate cross-domain risk, recommend approved playbooks, and keep humans in command — on top of Cisco networking, security, observability, collaboration, and AI protection.

---

*Confirmed in planning chat: roadmap rewritten for rubric; judge gaps (Cisco beat, human constraint, business metrics, named use cases, shadow-mode sustainability) folded into Section 5–6; optional AI question / Curated / Webex / dual-presenter recommended but not all mandatory.*
