# RootCauseX — Current Implementation State

Last Updated:
Phase 6 — Contextual Runtime Querying + Manual Phase Control

---

# Current Phase

Phase:
Phase 6 — Contextual Runtime Querying (Secondary Interaction Layer)

Status:
COMPLETE ✅ — Backend + Frontend done

Also completed this session:
- Manual Incident Phase Control — replaces 20s auto-advance with user-controlled "Next Phase →" button
- Password Reset Login Failure Scenario — secondary operational mystery for Ask Runtime demo

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

## Phase 5 — AI Cognition Experience ✅

### New files
- ✅ `store/InvestigationFocusStore.jsx` — centralized investigation cognition state (React context, no Redux)
  - `isActive`, `propagationPath`, `affectedServices`, `propagationStep` (-1=stable, N=animating), `activeStage`, `confidenceLevel`
  - `startInvestigation()`, `setStage()`, `rcaReady()`, `closeInvestigation()`
  - `rcaReady()` auto-fires step-by-step propagation animation timers (480ms per step)
- ✅ `components/RCAInsightCard.jsx` — polished intelligence card wrapper for RCA sections (icon + label header + colored border)
- ✅ `components/SuggestedQuestions.jsx` — 4 contextual follow-up questions dynamically generated from RCA propagation path

### Updated files
- ✅ `components/AIReasoningStream.jsx` — upgraded from 6 to 8 stages with detail sub-text per stage ("└─ mapping auth→payment→order topology"), pulsing header badge, `onStageChange` callback
- ✅ `components/InvestigationPanel.jsx` — animated confidence counter (counts up from ~55 to final score), RCAInsightCard sections, SuggestedQuestions, `startInvestigation`/`rcaReady` wired to store, `onStageChange` → store
- ✅ `components/DependencyGraph.jsx` — uses `InvestigationFocusStore` for `propagationStep`; nodes animate in one-by-one (pulse glow on each newly revealed node), "● RCA" pill on investigated nodes, "AI INVESTIGATION" mode badge in panel header, purple dot background during investigation
- ✅ `components/Dashboard.jsx` — `investigationActive` prop drives subtle purple scan-line sweep (fixed, 9s cycle), status bar shows "AI cognition active" in purple during investigation, passes `investigationPath` to TimelinePanel
- ✅ `components/TimelinePanel.jsx` — `investigationPath` prop; events whose `affectedServices` intersect the propagation path show pulsing "USED IN RCA" badge
- ✅ `App.jsx` — wrapped in `InvestigationFocusProvider`, passes `investigationActive={investigationOpen}` to Dashboard
- ✅ `index.css` — added `rca-node-pulse` keyframe animation

### Cognition UX flow (Phase 5)
```
User clicks Investigate
  ↓
InvestigationPanel: startInvestigation() → store.isActive = true
  ↓
AIReasoningStream: 8 stages animate in (680ms each), calling onStageChange(i) → store.activeStage updates
  ↓
DependencyGraph reacts to store.isActive: purple dot background, "AI INVESTIGATION" badge appears
Dashboard scan line begins sweeping (purple, very subtle)
  ↓
RCA arrives from backend
  ↓
InvestigationPanel: rcaReady(rca) → store stores path, kicks off propagation animation
  store dispatches propagationStep = 0 (auth lights up with pulse glow)
  → 480ms → propagationStep = 1 (auth→payment edge + payment lights up)
  → 480ms → propagationStep = 2 (payment→order edge + order lights up)
  → 600ms → propagationStep = -1 (stable — all path nodes + edges permanently lit in purple)
  ↓
DependencyGraph: nodes animate in one-by-one with pulse burst, "● RCA" pill added
TimelinePanel: "USED IN RCA" badge appears on events touching propagation path services
InvestigationPanel: confidence counter animates up (1.6s, ease-out cubic)
RCA sections appear as staggered RCAInsightCards
SuggestedQuestions appear below — contextual, reference real service names from path
```

---

## Phase 6 — Contextual Runtime Querying ✅

### Purpose
Secondary interaction layer — allows engineers to ask runtime-aware questions
independently of any active anomaly or investigation. Primary workflow
(incident → investigate → RCA) is unchanged and remains dominant.

### Backend — new
- ✅ `model/RuntimeQueryRequest.java` — record(query, investigationContext)
- ✅ `model/RuntimeQueryResponse.java` — record(summary, evidence[], services[], relatedDeployments[], confidence)
- ✅ `service/RuntimeQueryService.java` — full runtime context build + Claude API + pattern-matched MOCK mode
  - MOCK handles: deployment queries, auth instability, deployment cause, propagation, historical, topology, retry, payment, generic status
  - Each mock is incident-phase-aware (responds differently at phase 0 vs 1–4)
  - Falls back to mock automatically on Claude API failure
- ✅ `controller/RuntimeQueryController.java` — POST /runtime/query
- ✅ `service/InvestigationPromptBuilder.java` — added `buildRuntimeQuerySystemPrompt()` and `buildRuntimeQueryUserPrompt()`

### Backend — new endpoints
- ✅ POST /runtime/query

### Frontend — new
- ✅ `components/SuggestedRuntimeQueries.jsx` — 4 contextual chips adapting to: healthy / incident-active / investigation-active states
- ✅ `components/AskRuntimePanel.jsx` — compact runtime query panel:
  - Typewriter-style streaming response reveal (11ms/char)
  - Staggered evidence bullets after typewriter completes
  - Service chips + animated confidence bar
  - Related deployments section
  - Blinking cursor while streaming
  - Investigation context badge when `InvestigationFocusStore.isActive`
  - `prefill` prop: auto-fills + submits (used by anomaly quick-query)
  - Clears and accepts new queries after each response

### Frontend — updated
- ✅ `api/client.js` — added `runtimeQuery(query, investigationContext)`
- ✅ `components/AnomalyFeed.jsx` — `Terminal` icon button on each anomaly card → generates contextual query ("Why is auth-service showing Retry Amplification?") → pre-fills + submits AskRuntimePanel
- ✅ `components/Dashboard.jsx` — `AskRuntimePanel` rendered below anomaly feed on `dashboard` + `investigate` views; `runtimeQueryPrefill` state managed internally

### Investigation context awareness
When `InvestigationFocusStore.isActive`:
  - "INVESTIGATION CONTEXT" badge shown on panel header
  - Propagation path is passed to backend as `investigationContext`
  - Suggested queries change to investigation-specific ones
  - Claude receives the active RCA context in its prompt

### Anomaly quick-query flow
1. Incident active → anomaly cards appear
2. Click `⬡` (Terminal icon) on any anomaly card
3. `AskRuntimePanel` auto-populates with "Why is [service] showing [anomaly type]?"
4. Auto-submits → typewriter response appears

---

## Password Reset Login Failure Scenario ✅ (operational mystery for Ask Runtime demo)

### Purpose
Secondary demo scenario proving RootCauseX handles **subtle operational regressions**, not just
catastrophic incidents. The retry storm is the dramatic cinematic demo. This is the nuanced one.

### The story
auth-service v2.4 (commit f7e8d9a, alice, 1h ago) refactored JWT signing key rotation.
Password reset tokens are now issued with the new signing format, but downstream auth-validator
instances still cache the old keys. Post-reset logins fail intermittently — 9% failure rate
on that specific path. The dashboard stays mostly healthy (no red banner, no cascade).
The mystery only surfaces when someone asks Ask Runtime.

### What was changed
- ✅ `MockDataRepository.java` — auth-service updated to v2.4, latency 45ms → 65ms (subtle drift),
  deployment #5 added (f7e8d9a, "Refactor JWT signing key rotation"), commit f7e8d9a added at top of auth commits.
  v2.1 (retry storm) remains in history. Both coexist — different stories, different commits.
- ✅ `TimelineService.java` — 3 password reset events added (phase=0, always visible):
  5:45 PM: auth-service v2.4 deployed · 5:52 PM: login failure rate 0.3%→9% · 6:05 PM: JWT mismatch alerts
- ✅ `RuntimeQueryService.java` — 3 new mock response methods:
  `mockPasswordReset()` · `mockLoginFailure()` · `mockJwtSigningKey()`
  Triggered by patterns: "password reset", "reset login", "login fail", "jwt", "signing key", "token mismatch"
  `mockDeployments()` updated to mention v2.4 first as highest-risk recent change
- ✅ `SuggestedRuntimeQueries.jsx` — "Why are password reset logins failing?" added as first chip in HEALTHY_QUERIES

### Demo flow
1. Dashboard appears mostly healthy (auth latency 65ms — slightly elevated, no incident banner)
2. Ask Runtime panel visible with chip: **"Why are password reset logins failing?"**
3. User clicks → AI explains JWT signing key rotation, validator cache mismatch, 9% failure rate
4. Judges see contextual operational reasoning from a subtle signal — different from the retry storm

### What this proves (together with retry storm)
- Retry storm → catastrophic cascading failure → propagation intelligence
- Password reset → silent operational regression → contextual debugging intelligence
- RootCauseX handles BOTH ends of the severity spectrum

---

## Manual Incident Phase Control ✅ (also completed this session)

### Backend
- ✅ `IncidentStateManager.java` — replaced time-based `currentPhase()` with stored `volatile int currentPhase`
  - `trigger()` resets `currentPhase = 1`
  - `reset()` resets `currentPhase = 1`
  - `advancePhase()` increments up to max 4
- ✅ `IncidentController.java` — added `POST /incident/advance`

### Frontend
- ✅ `components/IncidentControls.jsx` — when incident active: P1–P4 badge pill + "Next Phase →" button (disabled + "Max Phase" at P4) + Reset button
- ✅ `api/client.js` — added `advanceIncident()`
- ✅ `App.jsx` — `handleAdvance` callback re-fetches services + status
- ✅ `components/Dashboard.jsx` — passes `onAdvance` to `IncidentControls`

### New endpoints (this session)
- ✅ POST /incident/advance

---

## Phase 4 — AI Investigation Workflows ✅

### Backend — new
- ✅ model/InvestigationRequest.java — record(anomalyId, timelineEventId)
- ✅ model/InvestigationResponse.java — record(id, title, **severity**, **endUserImpact**, probableRootCause, affectedServices, propagationPath, supportingEvidence, **correlatedDeployments**, recommendedActions, confidenceScore, reasoningSteps)
- ✅ model/FollowUpRequest.java — record(investigationId, question)
- ✅ model/FollowUpResponse.java — record(answer)
- ✅ service/InvestigationContextService.java — aggregates full runtime context narrative
- ✅ service/InvestigationPromptBuilder.java — builds forensic Claude prompts
- ✅ service/AIInvestigationService.java — Claude API + **MOCK mode fallback** + response parsing + bounded follow-up context store (max 100) + RestTemplate timeouts
- ✅ controller/InvestigationController.java — POST /investigate, POST /investigate/follow-up
- ✅ application.properties — anthropic.api.key, anthropic.model config

### Backend — new endpoints
- ✅ POST /investigate
- ✅ POST /investigate/follow-up

### Frontend — new
- ✅ components/AIReasoningStream.jsx — animated sequential reasoning steps
- ✅ components/InvestigationPanel.jsx — right-side drawer: **P0/P1/P2 severity badge** + **End User Impact banner** + **Correlated Deployments section** + RCA sections + follow-up chat

### Frontend — updated
- ✅ components/AnomalyFeed.jsx — Investigate button on each anomaly card + **active investigation highlight** (pulsing cyan border + "investigating" pill)
- ✅ components/TimelinePanel.jsx — Investigate button on active timeline events (non-deployment)
- ✅ components/DependencyGraph.jsx — investigationPath prop highlights propagation path in purple
- ✅ components/Dashboard.jsx — passes onInvestigate + investigationPath props
- ✅ App.jsx — investigation state (investigationOpen, investigatingAnomaly, investigationPath), handlers
- ✅ api/client.js — postInvestigate, postFollowUp

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
| POST /investigate                   | 4     | ✅ DONE   |
| POST /investigate/follow-up         | 4     | ✅ DONE   |
| POST /incident/advance              | 6     | ✅ DONE   |
| POST /runtime/query                 | 6     | ✅ DONE   |

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
