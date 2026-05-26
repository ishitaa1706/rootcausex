# RootCauseX — Current Implementation State

Last Updated:
Phase 1 — Runtime World (Frontend DONE · Backend DONE · AI NOT STARTED)

---

# Current Phase

Phase:
Phase 1 — Runtime World

Status:
COMPLETE ✅ — Frontend done, Backend done, AI not started

---

# Completed Features

## Frontend

- ✅ Vite + React scaffold
- ✅ Tailwind CSS v4 (via @tailwindcss/vite)
- ✅ Framer Motion installed
- ✅ React Flow (@xyflow/react) installed
- ✅ Lucide React icons installed
- ✅ Dark theme base CSS (cinematic, observability-inspired)
- ✅ Sidebar with nav icons
- ✅ Header with system status indicator
- ✅ SystemStatus banner (healthy / degraded / incident)
- ✅ MetricsCard per service (latency, error rate, retries, throughput + trends)
- ✅ DependencyGraph (React Flow — 5 nodes, 4 animated edges, custom nodes)
- ✅ Dashboard layout (grid of 5 metric cards + dependency graph)
- ✅ Mock runtime data (services, dependencies, deployments, systemStatus)
- ✅ API client (src/api/client.js — fetch wrappers for all backend endpoints)
- ✅ Dashboard live API integration (fetches from backend, falls back to mock data)

---

## Backend — DONE ✅

- ✅ Spring Boot 3.3.5 project setup (Maven)
- ✅ CORS configuration (allows localhost:5173)
- ✅ Model layer (Java records: MetricValue, ServiceMetrics, ServiceInfo, Dependency, Deployment, Commit, SystemStatus)
- ✅ MockDataRepository (in-memory, mirrors frontend mock data exactly)
- ✅ RuntimeDataService (business logic layer)
- ✅ GET /services — all services with full metrics
- ✅ GET /services/{id} — single service by id
- ✅ GET /services/dependencies — dependency graph edges
- ✅ GET /metrics — all metrics (serviceId → metrics map)
- ✅ GET /metrics/{serviceId} — metrics for a specific service
- ✅ GET /deployments — all deployment events
- ✅ GET /deployments/{serviceId} — deployments for a service
- ✅ GET /commits — full commit history across all services
- ✅ GET /commits/{serviceId} — commits scoped to a specific service
- ✅ GET /system/status — aggregated system health summary
- ✅ Backend README with startup instructions and API reference

---

## AI — NOT STARTED ❌

- [ ] Claude integration
- [ ] Runtime reasoning prompts
- [ ] Investigation flow
- [ ] Streaming responses

---

# Current Runtime World

## Services

- Auth Service      (v2.1) — healthy
- Payment Service   (v1.8) — healthy
- Order Service     (v3.2) — healthy
- Inventory Service (v2.0) — healthy
- Notification Service (v1.5) — healthy

---

## Active Incident Story

No active incident (Phase 1 = healthy system baseline).

Incident simulation begins in Phase 2 — Drift Detection.

---

# Current Backend State

## Implemented APIs

| Endpoint                    | Status   |
|-----------------------------|----------|
| GET /services               | ✅ DONE  |
| GET /services/{id}          | ✅ DONE  |
| GET /services/dependencies  | ✅ DONE  |
| GET /metrics                | ✅ DONE  |
| GET /metrics/{serviceId}    | ✅ DONE  |
| GET /deployments            | ✅ DONE  |
| GET /deployments/{serviceId}| ✅ DONE  |
| GET /commits                | ✅ DONE  |
| GET /commits/{serviceId}    | ✅ DONE  |
| GET /system/status          | ✅ DONE  |
| POST /investigate           | NOT BUILT (Phase 4) |

---

# Backend Files Created

| File                                                                    | Status  |
|-------------------------------------------------------------------------|---------|
| backend/pom.xml                                                         | ✅ DONE |
| backend/README.md                                                       | ✅ DONE |
| backend/src/main/resources/application.properties                       | ✅ DONE |
| backend/src/main/java/com/rootcausex/RootCauseXApplication.java        | ✅ DONE |
| backend/src/main/java/com/rootcausex/config/CorsConfig.java            | ✅ DONE |
| backend/src/main/java/com/rootcausex/model/MetricValue.java            | ✅ DONE |
| backend/src/main/java/com/rootcausex/model/ServiceMetrics.java         | ✅ DONE |
| backend/src/main/java/com/rootcausex/model/ServiceInfo.java            | ✅ DONE |
| backend/src/main/java/com/rootcausex/model/Dependency.java             | ✅ DONE |
| backend/src/main/java/com/rootcausex/model/Deployment.java             | ✅ DONE |
| backend/src/main/java/com/rootcausex/model/Commit.java                 | ✅ DONE |
| backend/src/main/java/com/rootcausex/model/SystemStatus.java           | ✅ DONE |
| backend/src/main/java/com/rootcausex/repository/MockDataRepository.java| ✅ DONE |
| backend/src/main/java/com/rootcausex/service/RuntimeDataService.java   | ✅ DONE |
| backend/src/main/java/com/rootcausex/controller/ServicesController.java| ✅ DONE |
| backend/src/main/java/com/rootcausex/controller/MetricsController.java | ✅ DONE |
| backend/src/main/java/com/rootcausex/controller/DeploymentsController.java | ✅ DONE |
| backend/src/main/java/com/rootcausex/controller/CommitsController.java | ✅ DONE |
| backend/src/main/java/com/rootcausex/controller/SystemController.java  | ✅ DONE |

---

# Frontend Files Updated (Phase 1 Backend Integration)

| File                                      | Status        |
|-------------------------------------------|---------------|
| frontend/src/api/client.js                | ✅ CREATED    |
| frontend/src/components/Dashboard.jsx     | ✅ UPDATED    |

Dashboard now:
- Starts with mock data for instant display
- Fetches from backend API on mount
- Shows "connected to backend" when live
- Falls back silently if backend is offline

---

# Current Frontend State

## Files

| File                                      | Status   |
|-------------------------------------------|----------|
| frontend/vite.config.js                   | ✅ DONE  |
| frontend/src/index.css                    | ✅ DONE  |
| frontend/src/main.jsx                     | ✅ DONE  |
| frontend/src/App.jsx                      | ✅ DONE  |
| frontend/src/data/mockData.js             | ✅ DONE  |
| frontend/src/api/client.js                | ✅ DONE  |
| frontend/src/components/Sidebar.jsx       | ✅ DONE  |
| frontend/src/components/Header.jsx        | ✅ DONE  |
| frontend/src/components/SystemStatus.jsx  | ✅ DONE  |
| frontend/src/components/MetricsCard.jsx   | ✅ DONE  |
| frontend/src/components/DependencyGraph.jsx | ✅ DONE |
| frontend/src/components/Dashboard.jsx     | ✅ DONE  |

---

# How to Run

## Backend

```bash
cd backend
mvn spring-boot:run
```
Runs on: http://localhost:8080

## Frontend

```bash
cd frontend
npm run dev
```
Runs on: http://localhost:5173

---

# Current Known Issues

## Active Bugs

- None (build passes clean)

---

# Current Blockers

- None

---

# Next Immediate Goal

Phase 2 — Drift Detection:

1. Add incident simulation trigger (POST /incident/trigger)
2. Make backend hold mutable service state (replace immutable records with stateful beans)
3. Show degraded/critical service states on MetricsCard
4. Animate service state transitions
5. Add incident banner overlay
6. Show anomaly alerts on metrics cards
7. Frontend polling (every 3–5s) to pick up live state changes

---

# Instructions For AI Agents

Before implementing anything:

1. Read:
- docs/rootcausex-context.md
- docs/current-state.md
- docs/claude-rules.md

2. Understand:
- current implementation progress
- existing architecture
- known blockers

3. DO NOT:
- rebuild existing functionality
- change architecture unnecessarily
- introduce new technologies
- overengineer the MVP

4. ALWAYS:
- keep implementation modular
- prioritize visible outcomes
- keep the hackathon scope controlled
