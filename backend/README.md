# RootCauseX — Backend

Runtime simulation engine for the RootCauseX AI-native incident investigation platform.

---

## Tech Stack

- **Java 17**
- **Spring Boot 3.3.5**
- **Maven**
- No database · No auth · No Docker

---

## Prerequisites

- Java 17+
- Maven 3.8+

Check versions:
```bash
java -version
mvn -version
```

---

## Run the Backend

```bash
cd backend
mvn spring-boot:run
```

The server starts on **http://localhost:8080**

---

## API Endpoints

### Services
| Method | Endpoint                   | Description                              |
|--------|----------------------------|------------------------------------------|
| GET    | `/services`                | All services with metrics                |
| GET    | `/services/{id}`           | Single service by id                     |
| GET    | `/services/dependencies`   | Service dependency graph edges           |

### Metrics
| Method | Endpoint                   | Description                              |
|--------|----------------------------|------------------------------------------|
| GET    | `/metrics`                 | All metrics (serviceId → metrics map)    |
| GET    | `/metrics/{serviceId}`     | Metrics for a specific service           |

### Deployments
| Method | Endpoint                   | Description                              |
|--------|----------------------------|------------------------------------------|
| GET    | `/deployments`             | All deployment events                    |
| GET    | `/deployments/{serviceId}` | Deployments scoped to a service          |

### Commits
| Method | Endpoint                   | Description                              |
|--------|----------------------------|------------------------------------------|
| GET    | `/commits`                 | Full commit history across all services  |
| GET    | `/commits/{serviceId}`     | Commits scoped to a specific service     |

### System
| Method | Endpoint                   | Description                              |
|--------|----------------------------|------------------------------------------|
| GET    | `/system/status`           | Aggregated system health summary         |

---

## Example Responses

**GET /services**
```json
[
  {
    "id": "auth",
    "name": "Auth Service",
    "shortName": "AUTH",
    "version": "v2.1",
    "status": "healthy",
    "uptime": 99.97,
    "color": "#38bdf8",
    "lastDeploy": "2h ago",
    "deployedBy": "alice",
    "metrics": {
      "latency":    { "current": 45,   "baseline": 42,   "unit": "ms",    "trend": "up"     },
      "errorRate":  { "current": 0.12, "baseline": 0.10, "unit": "%",     "trend": "up"     },
      "retries":    { "current": 12,   "baseline": 10,   "unit": "/min",  "trend": "up"     },
      "throughput": { "current": 1240, "baseline": 1200, "unit": "req/s", "trend": "stable" }
    }
  }
]
```

**GET /system/status**
```json
{
  "status": "healthy",
  "activeIncidents": 0,
  "servicesHealthy": 5,
  "servicesTotal": 5,
  "p99Latency": 120.0,
  "errorRate": 0.09,
  "totalThroughput": 5020.0
}
```

---

## Project Structure

```
backend/
├── pom.xml
└── src/main/java/com/rootcausex/
    ├── RootCauseXApplication.java       # Spring Boot entry point
    ├── config/
    │   └── CorsConfig.java              # CORS (allows localhost:5173)
    ├── model/
    │   ├── MetricValue.java             # { current, baseline, unit, trend }
    │   ├── ServiceMetrics.java          # { latency, errorRate, retries, throughput }
    │   ├── ServiceInfo.java             # Full service descriptor
    │   ├── Dependency.java              # Directed service dependency edge
    │   ├── Deployment.java              # Deployment event
    │   ├── Commit.java                  # Git commit record
    │   └── SystemStatus.java            # Aggregated system health
    ├── repository/
    │   └── MockDataRepository.java      # In-memory mock runtime data
    ├── service/
    │   └── RuntimeDataService.java      # Business logic layer
    └── controller/
        ├── ServicesController.java      # GET /services
        ├── MetricsController.java       # GET /metrics
        ├── DeploymentsController.java   # GET /deployments
        ├── CommitsController.java       # GET /commits
        └── SystemController.java        # GET /system/status
```

---

## Frontend Integration

The frontend (`frontend/`) connects automatically via `src/api/client.js`.

With backend running:
- Dashboard shows **"connected to backend"**

Without backend:
- Dashboard falls back to **mock runtime data** (seamless, no crash)

---

## Phase Roadmap

| Phase | Feature             | Status       |
|-------|---------------------|--------------|
| 1     | Runtime World       | ✅ DONE      |
| 2     | Drift Detection     | 🔜 Next      |
| 3     | Runtime Context     | Planned      |
| 4     | AI Investigation    | Planned      |
| 5     | AI Cognition Stream | Planned      |
| 6     | Demo Polish         | Planned      |
