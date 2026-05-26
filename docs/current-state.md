# RootCauseX — Current Implementation State

Last Updated:
Phase 3 — Runtime Context (Frontend DONE · Backend DONE · AI NOT STARTED)

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

## AI — NOT STARTED ❌
- [ ] Claude API integration
- [ ] POST /investigate endpoint
- [ ] Runtime reasoning prompt engineering
- [ ] AI chat panel
- [ ] Streaming response UI

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

# Next — Phase 4: AI Investigation

1. POST /investigate — gather runtime context bundle → Claude API
2. Build structured investigation prompt (services + anomalies + commits + timeline)
3. AI chat panel in frontend
4. Streaming response (SSE or chunked)
5. Root-cause explanation output

Phase 4 is the **money moment** of the demo.
The AI should say: "auth-service v2.1 retry policy is the likely root cause — commit a1b2c3d deployed 2h ago."

---

# Instructions For AI Agents

Before implementing anything:
1. Read: docs/rootcausex-context.md, docs/current-state.md, docs/claude-rules.md
2. Understand current progress and existing architecture
3. DO NOT rebuild existing functionality or overengineer
4. ALWAYS keep implementation modular and prioritize visible outcomes
