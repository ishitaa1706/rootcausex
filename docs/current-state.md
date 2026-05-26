# RootCauseX — Current Implementation State

Last Updated:
Phase 2 — Drift Detection (Frontend DONE · Backend DONE · AI NOT STARTED)

---

# Current Phase

Phase:
Phase 2 — Drift Detection & Incident Evolution

Status:
COMPLETE ✅ — Frontend done, Backend done, AI not started

---

# Completed Features

## Phase 1 — Runtime World ✅

### Frontend
- ✅ Vite + React scaffold, Tailwind CSS v4, Framer Motion, React Flow, Lucide React
- ✅ Dark cinematic UI (glassmorphism, glow effects, smooth animations)
- ✅ Sidebar, Header, SystemStatus banner, MetricsCard × 5, DependencyGraph, Dashboard
- ✅ API client (src/api/client.js)
- ✅ Mock runtime data fallback

### Backend
- ✅ Spring Boot 3.3.5 (Maven, Java 17), CORS config
- ✅ Model layer (7 Java records)
- ✅ MockDataRepository, RuntimeDataService
- ✅ GET /services, /services/{id}, /services/dependencies
- ✅ GET /metrics, /metrics/{serviceId}
- ✅ GET /deployments, /deployments/{serviceId}
- ✅ GET /commits, /commits/{serviceId}
- ✅ GET /system/status

---

## Phase 2 — Drift Detection ✅

### Backend — new
- ✅ model/Anomaly.java (id, timestamp, severity, affectedService, serviceName, anomalyType, description)
- ✅ model/IncidentStatus.java (active, phase, phaseIndex, triggeredAt, elapsedSeconds, affectedServices)
- ✅ service/IncidentStateManager.java — core time-based incident simulation engine
- ✅ service/DriftDetectionService.java — generates anomaly list based on incident phase
- ✅ controller/IncidentController.java — POST /incident/trigger, POST /incident/reset, GET /incident/status
- ✅ controller/AnomalyController.java — GET /anomalies
- ✅ service/RuntimeDataService.java updated — routes through IncidentStateManager

### Backend — new endpoints
- ✅ POST /incident/trigger
- ✅ POST /incident/reset
- ✅ GET  /incident/status
- ✅ GET  /anomalies

### Frontend — new components
- ✅ components/IncidentControls.jsx — trigger/reset buttons with glow animations
- ✅ components/AnomalyFeed.jsx — live scrolling anomaly alert feed

### Frontend — updated components
- ✅ App.jsx — lifted state (services, systemStatus, anomalies, incidentActive), polling (3s during incident)
- ✅ Header.jsx — accepts systemStatus prop, live status/color transitions
- ✅ SystemStatus.jsx — accepts systemStatus prop, animated banner transitions
- ✅ Dashboard.jsx — accepts all props, renders IncidentControls + AnomalyFeed
- ✅ DependencyGraph.jsx — accepts services prop, reactive edge/node colors (cyan→orange→red)
- ✅ MetricsCard.jsx — pulsing CSS animations for degraded/critical, alert metric highlighting
- ✅ api/client.js — added triggerIncident, resetIncident, getIncidentStatus, getAnomalies
- ✅ index.css — card-critical and card-degraded pulse animations

---

## AI — NOT STARTED ❌

- [ ] Claude integration
- [ ] Runtime reasoning prompts
- [ ] Investigation flow
- [ ] Streaming responses

---

# Incident Story (implemented)

Primary incident:
auth-service v2.1 introduced exponential backoff retry policy.
Under peak load this causes retry amplification.

Timeline (seconds since trigger):
- 0–20s  → Phase 1: auth DEGRADED (retries 85/min, latency 180ms)
- 20–40s → Phase 2: auth CRITICAL, payment DEGRADED (latency 980ms)
- 40–60s → Phase 3: auth CRITICAL, payment CRITICAL, order DEGRADED
- 60s+   → Phase 4: full cascade (all three CRITICAL)

Anomaly types generated:
- RETRY_AMPLIFICATION
- LATENCY_DRIFT
- ERROR_SPIKE
- THROUGHPUT_COLLAPSE
- DEPENDENCY_INSTABILITY

---

# Current API Surface

| Endpoint                    | Phase | Status   |
|-----------------------------|-------|----------|
| GET  /services              | 1     | ✅ DONE  |
| GET  /services/{id}         | 1     | ✅ DONE  |
| GET  /services/dependencies | 1     | ✅ DONE  |
| GET  /metrics               | 1     | ✅ DONE  |
| GET  /metrics/{serviceId}   | 1     | ✅ DONE  |
| GET  /deployments           | 1     | ✅ DONE  |
| GET  /commits               | 1     | ✅ DONE  |
| GET  /system/status         | 1     | ✅ DONE  |
| POST /incident/trigger      | 2     | ✅ DONE  |
| POST /incident/reset        | 2     | ✅ DONE  |
| GET  /incident/status       | 2     | ✅ DONE  |
| GET  /anomalies             | 2     | ✅ DONE  |
| POST /investigate           | 4     | NOT BUILT |

---

# How to Run

## Backend
```bash
cd backend
mvn spring-boot:run
```
→ http://localhost:8080

## Frontend
```bash
cd frontend
npm run dev
```
→ http://localhost:5173

---

# Known Issues

- None (backend compiles clean)

---

# Next Immediate Goal

Phase 3 — Runtime Context:

1. Timeline panel showing deployment/commit events
2. Incident timeline (events annotated with elapsed time)
3. Chronology view: deployments + commits + anomalies on a single axis
4. "What changed?" view correlated to incident start

Phase 4 — AI Investigation:

1. POST /investigate endpoint (build context bundle → Claude API)
2. AI chat panel in frontend
3. Runtime reasoning prompt engineering
4. Structured root-cause explanation output

---

# Instructions For AI Agents

Before implementing anything:

1. Read:
- docs/rootcausex-context.md
- docs/current-state.md
- docs/claude-rules.md

2. Understand current implementation progress and existing architecture.

3. DO NOT rebuild existing functionality or overengineer.

4. ALWAYS keep implementation modular and prioritize visible outcomes.
