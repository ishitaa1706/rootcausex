# RootCauseX — Current Implementation State

Last Updated:
Phase 3 — Runtime Context (Frontend DONE · Backend DONE · AI NOT STARTED)
Pre-Phase 4 cleanup: anomaly descriptions and timeline events trimmed to raw facts

---

# Current Phase

Phase:
Phase 3 — Runtime Context & Temporal Investigation

Status:
COMPLETE ✅ — Frontend done, Backend done, AI not started

---

# Completed Features

## Phase 1 — Runtime World ✅
- Vite + React scaffold, Tailwind v4, Framer Motion, React Flow
- Dark cinematic UI — glassmorphism, glow effects, animations
- Sidebar, Header, SystemStatus, MetricsCard × 5, DependencyGraph, Dashboard
- Spring Boot 3.3.5 (Maven, Java 17), CORS
- GET /services, /metrics, /deployments, /commits, /system/status

## Phase 2 — Drift Detection ✅
- IncidentStateManager — time-based cascade engine (4 phases)
- DriftDetectionService — anomaly generation per phase
- POST /incident/trigger, POST /incident/reset, GET /incident/status, GET /anomalies
- IncidentControls.jsx — trigger/reset buttons
- AnomalyFeed.jsx — live anomaly alert feed
- App.jsx — lifted state, 3s polling during incident
- DependencyGraph — reactive edge/node colors (cyan→orange→red)
- MetricsCard — pulsing CSS animations for degraded/critical

## Phase 3 — Runtime Context ✅

### Backend — new
- ✅ model/TimelineEvent.java (id, timestamp, eventType, severity, phase, title, description, affectedServices, relatedDeployment, relatedAnomaly)
- ✅ model/PlaybackState.java (phase, phaseName, phaseDescription, services, systemStatus, affectedServices, activeEventIds)
- ✅ service/TimelineService.java — 13 chronological incident events + playback state builder + deployment correlation
- ✅ controller/TimelineController.java — 3 endpoints
- ✅ service/IncidentStateManager.java — added getServicesForPhase() + getSystemStatusForPhase() (phase-based, used by timeline playback)

### Backend — new endpoints
- ✅ GET /timeline/events
- ✅ GET /timeline/playback-state/{phase}
- ✅ GET /timeline/correlation/{deploymentId}

### Frontend — new
- ✅ components/TimelinePanel.jsx — full incident timeline with playback controls

### Frontend — updated
- ✅ App.jsx — added playback state (playbackPhase, playbackServices, playbackSystemStatus), polling pauses during playback
- ✅ Dashboard.jsx — renders TimelinePanel, passes playbackPhase + onPlaybackPhaseChange
- ✅ api/client.js — added getTimelineEvents, getPlaybackState, getCorrelation
- ✅ index.css — added timeline-slider CSS for dark theme

---

## Pre-Phase 4 Cleanup ✅
- ✅ DriftDetectionService.java — all 10 anomaly descriptions trimmed to raw telemetry facts only
- ✅ TimelineService.java — all 13 timeline event descriptions trimmed to raw facts only
- ✅ TimelineService.java — correlation endpoint: removed rootCause and causalChain fields

**Why this matters — do not revert:**
All anomaly descriptions and timeline event descriptions are intentionally minimal.
They contain ONLY observable metrics (values, baselines, deltas, percentages, status codes).
They do NOT contain causal language, correlation conclusions, or root cause statements.

This is deliberate. Claude's job in Phase 4 is to reason over raw evidence and produce
the causal explanation itself. If the data already contains "Correlated with auth-service
v2.1 deployment" or "Root cause: retry policy amplification", Claude just regurgitates
it — that is not AI investigation, that is AI copy-paste. The descriptions must stay
as raw facts so Claude genuinely adds value.

In real production, monitoring systems (Prometheus, Datadog, CloudWatch) emit only
raw metric values — they never know the "why". Our data model mirrors that correctly.

## Phase 4 — AI Investigation Workflows ❌ NOT STARTED
- [ ] InvestigationContextService.java — context aggregation service
- [ ] InvestigationService.java — Claude API integration + prompt builder
- [ ] InvestigationController.java — POST /investigate endpoint
- [ ] InvestigationPanel.jsx — investigation side panel with streaming RCA output
- [ ] AnomalyFeed.jsx — add "Investigate" button to each anomaly card
- [ ] App.jsx — add investigatingAnomaly state
- [ ] api/client.js — add postInvestigate function

---

# Timeline Events (13 events across 5 phases)

| Phase | Time    | Event Type          | Title                              |
|-------|---------|---------------------|------------------------------------|
| 0     | 6:00 PM | DEPLOYMENT          | auth-service v2.1 deployed         |
| 0     | 6:02 PM | DEPLOYMENT          | payment-service v1.8 deployed      |
| 1     | 6:08 PM | DRIFT_DETECTED      | Retry amplification detected       |
| 1     | 6:10 PM | ANOMALY             | Latency drift — auth-service       |
| 1     | 6:12 PM | SERVICE_DEGRADED    | auth-service → DEGRADED            |
| 2     | 6:15 PM | ANOMALY             | Latency drift — payment-service    |
| 2     | 6:17 PM | SERVICE_CRITICAL    | auth-service → CRITICAL            |
| 2     | 6:18 PM | SERVICE_DEGRADED    | payment-service → DEGRADED         |
| 3     | 6:20 PM | CASCADE_PROPAGATION | Cascade: auth → payment → order    |
| 3     | 6:22 PM | SERVICE_CRITICAL    | payment-service → CRITICAL         |
| 3     | 6:25 PM | SERVICE_DEGRADED    | order-service → DEGRADED           |
| 4     | 6:28 PM | SERVICE_CRITICAL    | order-service → CRITICAL           |
| 4     | 6:28 PM | CASCADE_PROPAGATION | Full dependency chain failure      |

---

# Full API Surface

| Endpoint                            | Phase | Status    |
|-------------------------------------|-------|-----------|
| GET  /services                      | 1     | ✅ DONE   |
| GET  /services/{id}                 | 1     | ✅ DONE   |
| GET  /services/dependencies         | 1     | ✅ DONE   |
| GET  /metrics                       | 1     | ✅ DONE   |
| GET  /deployments                   | 1     | ✅ DONE   |
| GET  /commits                       | 1     | ✅ DONE   |
| GET  /system/status                 | 1     | ✅ DONE   |
| POST /incident/trigger              | 2     | ✅ DONE   |
| POST /incident/reset                | 2     | ✅ DONE   |
| GET  /incident/status               | 2     | ✅ DONE   |
| GET  /anomalies                     | 2     | ✅ DONE   |
| GET  /timeline/events               | 3     | ✅ DONE   |
| GET  /timeline/playback-state/{p}   | 3     | ✅ DONE   |
| GET  /timeline/correlation/{id}     | 3     | ✅ DONE   |
| POST /investigate                   | 4     | NOT BUILT |

---

# How to Run

## Backend
```bash
cd backend && mvn spring-boot:run
```
→ http://localhost:8080

## Frontend
```bash
cd frontend && npm run dev
```
→ http://localhost:5173

---

# Next — Phase 4: AI Investigation Workflows

## Product Direction

We are NOT building a generic chatbot or ChatGPT inside a dashboard.

We ARE building contextual AI-native investigation workflows:
- AI is embedded INTO the runtime system
- Investigation is triggered from anomalies directly
- Context is gathered automatically before Claude responds
- RCA is structured and evidence-driven
- Follow-up chat opens after the RCA for deeper investigation

## Investigation Flow

```
runtime anomaly detected
→ user clicks "Investigate" on anomaly card
→ platform automatically gathers full runtime context
→ Claude generates structured RCA automatically
→ follow-up investigation chat opens
→ developer asks deeper questions
```

The AI should NEVER start from an empty chat.
Context is always pre-loaded before Claude responds.

## Steps
1. InvestigationContextService — aggregate full runtime context bundle
2. POST /investigate — receive anomaly id + question → call Claude API → stream response
3. "Investigate" button on each anomaly card in AnomalyFeed
4. InvestigationPanel — side panel with structured RCA output + follow-up chat
5. Streaming response (SSE preferred)

---

## The Money Moment

Phase 4 is the **money moment** of the demo.

The user triggers an incident, watches the cascade, then opens the AI chat panel and asks:
**"What caused this?"**

Claude should reason its way to:

> "auth-service v2.1 was deployed at 6:00 PM (commit a1b2c3d). 8 minutes later, retry
> rate on auth spiked from 10/min to 85/min (+750%). The commit introduced an exponential
> backoff retry policy — under peak traffic this amplifies: each failed request retries
> multiple times, multiplying load on an already-stressed service. By 6:12 PM auth was
> DEGRADED, by 6:17 PM CRITICAL with 12.8% error rate. Payment service, which depends
> on auth for JWT validation, began timing out at 6:15 PM — its own retry rate hit
> 280/min against auth. Order service, downstream of both, received degraded responses
> from 2 upstream dependencies and cascaded to CRITICAL by 6:28 PM. 28 minutes from
> deployment to full cascade. Likely root cause: the exponential backoff retry policy
> introduced in auth v2.1 amplifies under peak load and cascades downstream."

Claude reaches this answer by connecting:
- **Deployment timing** — auth v2.1 deployed at 6:00 PM, anomaly onset at 6:08 PM (8 min gap)
- **Commit message** — "Introduced exponential backoff retry policy" (in MockDataRepository)
- **Metric spikes** — retry rate +750%, latency +329%, all on auth first
- **Dependency topology** — auth → payment → order (from GET /services/dependencies)
- **Sequential degradation** — each downstream service fell in exact dependency order

---

## InvestigationContextService

New service class responsible for aggregating all runtime context before Claude is called.

Responsibilities:
- gather current service states + metrics (GET /services)
- gather active anomalies (GET /anomalies)
- gather recent deployments with commit messages (GET /deployments)
- gather recent commits (GET /commits)
- gather dependency topology (GET /services/dependencies)
- gather incident phase + timeline events (GET /timeline/events)
- gather system status (GET /system/status)
- transform all of the above into a structured AI-readable operational narrative

This service runs BEFORE every Claude call. Claude never receives a cold context.

## Context Bundle for POST /investigate

The endpoint must gather and send to Claude:

```json
{
  "triggeredByAnomaly": { /* the specific anomaly the user clicked Investigate on */ },
  "question": "<user's question — or auto-generated: 'What caused this anomaly?'>",
  "services": [ /* current status, metrics for all 5 services */ ],
  "anomalies": [ /* all active anomalies — raw metric facts */ ],
  "recentDeployments": [ /* last 5 deployments — includes commit messages */ ],
  "recentCommits": [ /* last 10 commits — includes commit messages */ ],
  "timelineEvents": [ /* chronological incident story up to current phase */ ],
  "dependencies": [ /* service dependency edges */ ],
  "systemStatus": { /* overall system health */ },
  "incidentPhase": 0
}
```

**What NOT to send to Claude:**
- GET /timeline/correlation/{id} — stripped of rootCause and causalChain on purpose.
  Do not include correlation data. Claude must reason to the answer itself.

---

## Prompt Engineering Notes

The system prompt must instruct Claude to:
1. Act as a runtime investigator, not a chatbot
2. Reason over the evidence provided — do not hallucinate facts not in the data
3. Identify the specific deployment/commit most likely responsible
4. Explain the signal chain: what metric spiked first, on which service, when
5. State confidence level — "likely" vs "confirmed"
6. Be concise — this is a terminal panel, not an essay
7. Structure the initial RCA response in this exact format (see below)

The initial question is auto-generated from the anomaly context:
**"Investigate this anomaly: [anomalyType] on [serviceName] — [description]"**

After the RCA, the chat opens for free-form follow-up questions.

## Structured RCA Response Format

Claude's initial response must follow this structure:

```
1. PROBABLE ROOT CAUSE
   What most likely caused this — specific service, deployment, or config change

2. AFFECTED SYSTEMS
   Which services are impacted and their current state

3. PROPAGATION PATH
   How the failure spread — the dependency chain sequence

4. SUPPORTING EVIDENCE
   The specific metrics and signals that support the conclusion

5. CORRELATED DEPLOYMENTS
   Which recent deployments are temporally or causally linked

6. RECOMMENDED NEXT INVESTIGATION
   What the developer should look at next to confirm or dig deeper
```

This must NOT feel like a generic chatbot response.
It should feel like an automated incident report generated by an intelligent system.

---

## UI — Investigation Panel

- "Investigate" button on EACH anomaly card in AnomalyFeed (not a single dashboard button)
- Clicking opens InvestigationPanel as a side panel or modal
- Panel shows: anomaly context at top, then streaming RCA output below
- Streaming text with typing effect (SSE preferred)
- After RCA completes: follow-up chat input appears for deeper questions
- Highlight service names in the RCA text (cyan = root cause, orange = affected)
- Show "Analyzing runtime context..." state while Claude is processing

---

# Instructions For AI Agents

Before implementing anything:
1. Read: docs/rootcausex-context.md, docs/current-state.md, docs/claude-rules.md
2. Understand current progress and existing architecture
3. DO NOT rebuild existing functionality or overengineer
4. ALWAYS keep implementation modular and prioritize visible outcomes
