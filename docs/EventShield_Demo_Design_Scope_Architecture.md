# Cisco EventShield Demo
## Design, Scope, and Architecture Specification

**Customer:** N.C. State Fair Division  
**Primary user:** Fair Operations Director  
**Demo:** Fully live, approximately 8 minutes within a 20-minute presentation  
**Audience:** Cisco engineers, sales leaders, and business stakeholders  
**Initial deployment:** Local MacBook, internet available  
**Data:** Synthetic, streamed every 1–2 seconds  
**Visual style:** Classic Cisco enterprise UI with a simplified fairgrounds map

---

## 1. Demo thesis

The N.C. State Fair functions like a temporary city. Ticketing, transportation, networking, screening, staffing, crowd flow, and communications may each appear only mildly degraded while the event as a whole is becoming unready.

EventShield connects those signals and answers:

- Are we ready?
- What hidden dependency is failing?
- What will happen next?
- What should we do?
- Who must approve the response?
- Did the response work?

The key innovation demonstrated is not basic monitoring. It is cross-domain, event-specific reasoning.

A normal dashboard reports:

- three scanners are offline
- Wi-Fi utilization is high
- a train is delayed
- one screening lane is closed
- the queue is growing

EventShield reports:

> Gate 1 cannot absorb the incoming arrival wave because scanner throughput, wireless capacity, and screening capacity are degrading simultaneously.

---

## 2. Demo goals

The demo must prove that EventShield:

1. Connects multiple independent systems.
2. Detects cascading risk no individual source can see.
3. Uses real rules, graph logic, forecasting, and AI explanation.
4. Keeps the user-facing interface simple.
5. Requires human approval before operational actions.
6. Verifies whether the approved response worked.
7. Remains reliable during a live presentation.

---

## 3. Demo narrative

### Scene 1: Pre-opening readiness

The demo begins 35 minutes before opening.

Initial state:

```text
OPENING STATUS: CONDITIONAL OPEN
Readiness Score: 78
Confidence: High
Critical dependencies at risk: 3
```

Synthetic conditions:

- 17 of 20 Gate 1 scanners are online.
- Gate 1 wireless utilization is elevated.
- Backup connectivity has not been verified.
- An Amtrak arrival with approximately 280–340 passengers is expected soon.
- One screening lane is understaffed.
- Other gates, paging, signage, and weather are healthy.

EventShield insight:

> Gate 1 is likely to fall below required entry throughput because scanner capacity, wireless headroom, backup connectivity, screening staffing, and incoming transportation demand are all marginal at the same time.

Recommended actions:

1. Move two mobile scanners to Gate 1.
2. Verify backup wireless failover.
3. Assign two additional screening staff.
4. Prepare an alternate east gate for overflow.

The Fair Operations Director approves the first three. Actions take 3–8 seconds and update synthetic source states.

Recovery:

```text
Scanners: 17/20 → 19/20
Backup path: Unverified → Verified
Gate staffing: Below plan → At plan
Readiness: 78 → 91
Status: CONDITIONAL OPEN → READY TO OPEN
```

### Scene 2: Live disruption response

One hour after opening:

- Amtrak arrives 20–30 minutes late.
- A GoRaleigh shuttle arrives almost simultaneously.
- Gate 1 wireless utilization rises to 90–96%.
- Two to four scanners begin timing out.
- One of four screening lanes closes.
- Queue density rises rapidly.
- Etix cloud health remains normal.

EventShield correlates the signals:

> Gate 1 is experiencing a localized capacity collapse caused by synchronized transportation arrivals, reduced screening capacity, and wireless congestion. Etix cloud services are healthy, so this is not a systemwide ticketing outage.

Recommended plan:

1. Switch four mobile scanners to backup connectivity.
2. Prioritize ticket-validation traffic.
3. Dispatch four additional staff.
4. Reopen the closed screening lane.
5. Redirect the next shuttle to the alternate east gate.
6. Update directional signage.
7. Create a simulated Webex incident room.

Approval card:

```text
Risk: Medium
Expected recovery: 8–12 minutes

[Reject] [Modify] [Approve Plan]
```

After approval, the synthetic environment recovers gradually:

```text
Scanner success: 76% → 89% → 98%
Queue: 480 → 405 → 320 → 255
Projected wait: 22 min → 15 min → 9 min
Wireless utilization: 94% → 86% → 74%
Incident: CRITICAL → STABILIZING → RESOLVED
```

The full loop is:

```text
Detect → Understand → Recommend → Approve → Act → Verify
```

---

## 4. Scope

### In scope

- Main command dashboard
- Simplified fairgrounds map
- Pre-opening readiness score and status
- Real-time synthetic streams
- Cross-domain incident correlation
- Dependency-graph reasoning
- Queue and capacity forecasting
- AI explanations
- Suggested AI questions
- Ranked response plan
- Human approval
- Simulated execution
- Recovery verification
- Hidden evidence drawer
- Hidden scenario-control panel
- Actual Splunk ingestion
- Local deployment
- Canned AI fallback

### Out of scope

- Real N.C. State Fair, Etix, Amtrak, or GoRaleigh APIs
- Real Cisco device control
- Real crowd surveillance
- Facial recognition
- Payment-card data
- Gate closure, evacuation, police, or ride-control automation
- Exact fairgrounds geography
- Production-grade multitenancy or disaster recovery

Every page must display:

> Simulated data for demonstration purposes.

---

## 5. User experience

### Primary persona

Fair Operations Director.

### UX principles

- Plain language before telemetry
- Status before detail
- Three top risks maximum
- Technical evidence available on demand
- Visible confidence and data freshness
- Clear action owner and approver
- No unrestricted chatbot
- No unexplained AI claim

### Main views

1. **Command Center**
2. **Gate 1 Detail**
3. **Active Incident**
4. **Event Timeline**

The Evidence drawer is hidden by default.

### Suggested AI questions

Before opening:

- Why are we not ready?
- What should we fix first?
- What happens if we open now?
- Which team owns each blocker?

During the incident:

- What is causing the Gate 1 delay?
- Is Etix down?
- What is the fastest safe response?
- Why redirect the shuttle?
- What happens if we do nothing?

---

## 6. UI design

### Command Center

Show:

- Ready / Conditional Open / Not Ready
- Readiness score
- Confidence
- Last evaluated time
- Top three risks
- Simplified map
- Active incidents
- Suggested questions

### Simplified map

```text
                 NORTH PARKING

ALTERNATE EAST GATE    MIDWAY    LIVESTOCK

                 CENTRAL FAIR

GATE 1 / TRANSIT HUB   FOOD ZONE
```

Gate 1 visually links to train, shuttle, ticketing, screening, and network status.

### Gate 1 Detail

Show:

- Gate readiness
- Queue estimate
- Scanners online
- Validation success
- Screening lanes
- Staffing
- Wi-Fi utilization
- Upcoming arrivals
- Predicted wait

### Active Incident

Show:

- Incident title and severity
- Plain-language summary
- Likely cause
- Affected dependencies
- Confidence
- Response plan
- Required approvers
- Expected result
- Approve / Modify / Reject

### Evidence drawer

Show an inspectable reasoning summary, not hidden chain-of-thought:

```text
1. Arrival demand increased 2.3x.
2. Screening capacity dropped 25%.
3. Scanner success fell below 80%.
4. Etix synthetic external test remained healthy.
5. Local wireless retries exceeded threshold.
6. Root cause classified as local capacity degradation.
```

Also show raw normalized events, timestamps, rules triggered, model outputs, and source confidence.

---

## 7. Hidden scenario controller

Controls:

- Reset Demo
- Start Pre-Opening
- Apply Readiness Fixes
- Mark Ready
- Advance to Live Event
- Trigger Gate 1 Incident
- Approve Recovery
- Force Recovery
- Toggle AI Fallback
- Pause Streams
- Resume Streams

It should be hidden behind a keyboard shortcut, local admin route, or discreet icon.

---

## 8. Synthetic data sources

### Cisco network telemetry

- AP utilization
- Packet loss
- Retry rate
- Scanner disconnects
- Backup path status
- WAN health

### Etix ticketing

- Scanners online
- Validation success
- Validation latency
- Gate throughput
- External service health

### Amtrak

- Scheduled arrival
- ETA
- Delay
- Estimated passenger count
- Station status

### GoRaleigh

- Shuttle ETA
- Passenger estimate
- Destination gate
- Service state

### Gate operations

- Screening lanes
- Staffing
- Mobile scanner availability
- Alternate-gate readiness

### Crowd analytics

- Queue estimate
- Arrival rate
- Processing rate
- Density
- Predicted wait
- Trend

### Communications and workflow

- Signage status
- Active message
- Incident-room status
- Staff-task state
- Notification state

Weather may stream in the background but is not part of the main cascade.

### Update rate

- Events every 1–2 seconds
- Readiness reevaluation every 2–3 seconds
- Forecast reevaluation every 3–5 seconds
- UI smoothing window of 3–5 events

### Controlled randomization

Values may vary within bounds, but the causal story must never change:

```text
arrival surge
+ reduced screening capacity
+ network degradation
+ scanner slowdown
= localized Gate 1 capacity collapse
```

---

## 9. Common event schema

```json
{
  "eventId": "evt_8f93",
  "timestamp": "2026-10-17T10:34:21-04:00",
  "scenarioId": "gate1_live_incident",
  "sourceSystem": "cisco_wireless",
  "sourceType": "network",
  "assetId": "AP-GATE1-04",
  "assetType": "wireless_access_point",
  "locationId": "gate_1",
  "domain": "admission",
  "eventType": "capacity.degraded",
  "severity": "high",
  "status": "active",
  "confidence": 0.98,
  "metrics": {
    "channelUtilization": 94,
    "retryRate": 29,
    "packetLoss": 7.2
  },
  "tags": ["gate1", "ticketing", "entry"],
  "synthetic": true
}
```

Required domains:

- admission
- network
- transportation
- security
- staffing
- crowd
- communications
- weather

---

## 10. Dependency model

```text
Gate 1 Entry Capacity
├── Etix Validation
├── Scanner Fleet
├── Gate 1 Wireless
├── Screening Lanes
├── Gate Staff
├── Crowd Queue Capacity
├── Amtrak Arrival Demand
├── GoRaleigh Arrival Demand
├── Alternate East Gate
└── Digital Signage
```

Recommended first-build storage:

- PostgreSQL tables or JSON configuration
- graph behavior implemented in application logic
- no dedicated graph database unless review identifies a real need

---

## 11. Intelligence architecture

### Layer 1: Streaming correlation

Correlate by:

- time
- location
- shared dependency
- domain
- asset relationship
- threshold direction

Use sliding windows and incident signature templates.

### Layer 2: Readiness engine

Combine:

- domain scores
- deterministic hard stops
- dependency penalties
- forecast risk
- confidence penalties
- stale-data penalties

Suggested weights:

| Domain | Weight |
|---|---:|
| Admission and gate readiness | 30% |
| Network and digital services | 20% |
| Transportation | 15% |
| Security and screening | 15% |
| Staffing | 10% |
| Communications | 5% |
| Weather | 5% |

The initial scenario should use a cascading conditional risk, not a hard stop.

### Layer 3: Forecasting

Simplified queue model:

```text
queue change = incoming arrival rate - effective processing rate
```

```text
effective processing rate =
base lane rate
× active screening lanes
× scanner success factor
× network health factor
× staffing factor
```

```text
predicted wait = current queue / effective processing rate
```

Confidence reflects data freshness, completeness, agreement, and forecast horizon.

### Layer 4: LLM reasoning

The LLM may:

- Explain readiness changes
- Summarize incident cause
- Rank approved playbook actions
- Explain tradeoffs
- Answer suggested questions
- Draft incident and visitor messages

The LLM may not:

- Calculate the authoritative score
- Invent safety thresholds
- Override rules
- Invent source data
- Execute unrestricted tools
- Make final safety decisions

Use a playbook-first flow:

1. Retrieve approved actions.
2. Filter by available resources.
3. Rank by expected effect.
4. Pass candidates and evidence to the LLM.
5. Generate explanation and combined plan.
6. Require human approval.

---

## 12. Response engine

Workflow:

```text
Incident detected
→ signals correlated
→ impact estimated
→ playbook retrieved
→ candidate actions filtered
→ AI ranks and explains
→ human approves
→ synthetic actions execute
→ recovery is monitored
```

Safe simulated actions:

- Switch scanners to backup connectivity
- Assign staff
- Redirect shuttle
- Update signage
- Create incident room

Excluded actions:

- Gate closure
- Evacuation
- Police dispatch
- Emergency announcement
- Ride shutdown

Each action includes owner, risk, expected impact, completion time, and approver.

---

## 13. Splunk integration

Actual Splunk should be included.

Role:

- Receive normalized events
- Store telemetry
- Support source filtering
- Preserve historical evidence
- Prove real streaming integration

Synthetic generators publish both to the application event bus and Splunk HTTP Event Collector.

Suggested indexes:

- `eventshield_network`
- `eventshield_ticketing`
- `eventshield_transport`
- `eventshield_gate_ops`
- `eventshield_crowd`
- `eventshield_workflow`
- `eventshield_incidents`

Splunk is not the main UI. It is available for evidence and technical Q&A.

---

## 14. Backend services

- **Scenario Controller:** controls demo phases
- **Synthetic Generators:** one per source
- **Event Normalizer:** maps payloads to common schema
- **Event Bus:** transports events to UI and Splunk
- **Correlation Engine:** creates incident clusters
- **Dependency Engine:** evaluates downstream impact
- **Readiness Engine:** calculates scores and status
- **Forecasting Engine:** estimates queue and recovery
- **Playbook Engine:** retrieves and filters actions
- **AI Orchestrator:** builds context and calls the model
- **Action Orchestrator:** stages and executes simulated actions
- **API Gateway:** REST, streaming, admin, and AI endpoints

---

## 15. Recommended initial stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- SVG fairgrounds map
- WebSocket client
- Lightweight charts

### Backend

Preferred starting point:

- FastAPI
- Python
- REST
- WebSockets or Server-Sent Events

A TypeScript backend remains acceptable if the team strongly prefers one language.

### Storage and transport

- PostgreSQL
- Redis for live state and lightweight streams
- Avoid Kafka for the demo
- Avoid a dedicated graph database initially

### Integrations

- Local Splunk with HEC
- Configurable LLM provider abstraction
- Canned fallback responses

### Deployment

Docker Compose services:

```text
frontend
backend
postgres
redis
splunk
synthetic-generators
```

Startup target:

```bash
docker compose up
```

Then open:

```text
http://localhost:3000
```

---

## 16. API outline

Main endpoints:

```text
GET  /api/readiness
GET  /api/domains
GET  /api/locations
GET  /api/incidents
GET  /api/incidents/{id}
GET  /api/evidence/{incidentId}
POST /api/ai/question
POST /api/actions/{id}/approve
POST /api/actions/{id}/reject
```

Admin endpoints:

```text
POST /api/admin/reset
POST /api/admin/start-preopening
POST /api/admin/apply-readiness-fixes
POST /api/admin/start-live-event
POST /api/admin/trigger-gate1-incident
POST /api/admin/force-recovery
POST /api/admin/toggle-ai-fallback
```

Streaming:

```text
WS /api/stream
```

---

## 17. Data storage

Core tables:

- events
- assets
- locations
- dependencies
- readiness_snapshots
- domain_scores
- incidents
- incident_evidence
- playbooks
- actions
- action_approvals
- scenario_state
- ai_responses

Store every important decision:

- input facts
- score
- rule triggers
- forecast
- AI response
- approval
- execution
- recovery result

---

## 18. Reliability requirements

Performance targets:

- Event-to-screen update under 2 seconds
- Readiness reevaluation under 3 seconds
- Incident detection under 5 seconds
- AI response target under 6 seconds
- AI fallback under 1 second

The demo must run for at least 30 minutes without:

- stream leaks
- UI freezes
- duplicate incidents
- uncontrolled score oscillation

Reliability safeguards:

- Hidden control panel
- Scenario reset
- Force recovery
- AI timeout and fallback
- Local core services
- Health checks
- Seeded configuration
- Rehearsal mode
- A prerecorded backup should still be made, even though the intended demo is live

---

## 19. Acceptance criteria

The demo is ready only when:

- All seven sources stream every 1–2 seconds.
- Events appear in Splunk.
- Readiness updates automatically.
- The initial risk requires multiple dependencies.
- AI explains the cascade accurately.
- Approved fixes change source state.
- The live incident is correlated correctly.
- Etix remains healthy while local Gate 1 operations fail.
- Queue forecasts react to demand and capacity.
- Recovery is visible.
- AI fallback works.
- Reset restores a clean scenario.
- The full flow succeeds three times in a row.

---

## 20. Build order

1. Project skeleton and Docker Compose
2. Scenario state machine and hidden control panel
3. Synthetic generators
4. Streaming transport
5. Readiness engine
6. Command Center UI
7. Dependency and incident correlation
8. Queue forecasting
9. Response playbooks and approvals
10. Synthetic action execution
11. AI explanations and suggested questions
12. Splunk integration
13. Evidence drawer
14. Reliability testing and visual polish

---

## 21. Production mapping

| Demo | Production |
|---|---|
| Synthetic Cisco metrics | Catalyst, Meraki, SD-WAN, ISE |
| Synthetic Etix stream | Official API, logs, or partner connector |
| Synthetic Amtrak stream | Authorized rail feed |
| Synthetic GoRaleigh stream | GTFS-Realtime or partner feed |
| Synthetic crowd data | Privacy-preserving edge analytics |
| Redis/internal event bus | Enterprise streaming platform |
| JSON/Postgres dependencies | Production graph service |
| Local Splunk | Enterprise Splunk |
| Simulated Webex | Webex APIs |
| Local roles | SSO and RBAC |
| Simulated actions | Approved connector actions |
| Docker Compose | Hybrid edge and cloud deployment |

---

## 22. Final product statement

> Cisco EventShield connects the devices, services, transportation systems, and operating teams that a major event depends on. Before opening, it determines whether the event is truly ready. During a disruption, it correlates failures across domains, identifies the likely operational cause, recommends a response based on approved playbooks, and verifies whether the response worked. Humans remain in command throughout.

---

## 23. Architecture review request

Review this proposal as if it were about to be implemented for a high-stakes live presentation.

Please return:

1. Clear verdict
2. Must-fix issues
3. Fragile assumptions
4. Overengineered components
5. Underengineered components
6. Recommended final stack
7. Recommended architecture changes
8. Better queue or readiness logic, if necessary
9. Demo reliability safeguards
10. Final go/no-go assessment

Prioritize reliability, technical coherence, honest AI usage, production plausibility, and minimum unnecessary complexity. Do not merely approve the design.
