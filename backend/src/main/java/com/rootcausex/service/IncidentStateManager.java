package com.rootcausex.service;

import com.rootcausex.model.*;
import com.rootcausex.repository.MockDataRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Core incident simulation engine for RootCauseX Phase 2.
 *
 * Holds mutable incident state and returns service/system data
 * that reflects the current degradation phase — no background
 * threads, no database. Pure time-based computation.
 *
 * Incident story:
 *   auth-service v2.1 introduced a retry amplification bug.
 *   Under peak load (6–7 PM) retries cascade downstream:
 *   auth → payment → order degrades progressively.
 *
 * Phase timeline (seconds since trigger):
 *   0–20s  → Phase 1: auth DEGRADED
 *   20–40s → Phase 2: auth CRITICAL, payment DEGRADED
 *   40–60s → Phase 3: auth CRITICAL, payment CRITICAL, order DEGRADED
 *   60s+   → Phase 4: full cascade CRITICAL
 */
@Service
public class IncidentStateManager {

    private final MockDataRepository repository;

    private volatile boolean active = false;
    private volatile Instant triggeredAt = null;

    public IncidentStateManager(MockDataRepository repository) {
        this.repository = repository;
    }

    // ── Control ───────────────────────────────────────────────────────────────

    public void trigger() {
        triggeredAt = Instant.now();
        active = true;
    }

    public void reset() {
        active = false;
        triggeredAt = null;
    }

    public boolean isActive()         { return active; }
    public Instant getTriggeredAt()   { return triggeredAt; }

    public long elapsedSeconds() {
        if (!active || triggeredAt == null) return 0;
        return Duration.between(triggeredAt, Instant.now()).getSeconds();
    }

    public int currentPhase() {
        if (!active) return 0;
        long s = elapsedSeconds();
        if (s < 20) return 1;
        if (s < 40) return 2;
        if (s < 60) return 3;
        return 4;
    }

    // ── Status ────────────────────────────────────────────────────────────────

    public IncidentStatus getStatus() {
        if (!active) {
            return new IncidentStatus(false, "HEALTHY", 0, null, 0, List.of());
        }
        int phase = currentPhase();
        String phaseName = (phase <= 2) ? "DEGRADED" : "CRITICAL";
        List<String> affected = switch (phase) {
            case 1 -> List.of("auth");
            case 2 -> List.of("auth", "payment");
            default -> List.of("auth", "payment", "order");
        };
        return new IncidentStatus(
            true, phaseName, phase,
            triggeredAt.toString(), elapsedSeconds(), affected
        );
    }

    // ── Live service data ─────────────────────────────────────────────────────

    public List<ServiceInfo> getCurrentServices() {
        if (!active) return repository.getServices();
        int phase = currentPhase();
        return repository.getServices().stream()
            .map(s -> applyIncidentState(s, phase))
            .toList();
    }

    public SystemStatus getCurrentSystemStatus() {
        if (!active) return repository.getSystemStatus();
        return switch (currentPhase()) {
            case 1 -> new SystemStatus("degraded", 1, 4, 5, 180.0,  3.2,  4580.0);
            case 2 -> new SystemStatus("incident", 1, 3, 5, 980.0,  8.4,  4270.0);
            case 3 -> new SystemStatus("incident", 1, 2, 5, 1800.0, 18.2, 3580.0);
            default -> new SystemStatus("incident", 1, 1, 5, 1800.0, 24.6, 2830.0);
        };
    }

    // ── State application ─────────────────────────────────────────────────────

    private ServiceInfo applyIncidentState(ServiceInfo s, int phase) {
        return switch (s.id()) {
            case "auth"    -> authState(s, phase);
            case "payment" -> paymentState(s, phase);
            case "order"   -> orderState(s, phase);
            default        -> s;
        };
    }

    private ServiceInfo authState(ServiceInfo s, int phase) {
        if (phase == 1) {
            return withState(s, "degraded", s.uptime() - 0.5,
                new ServiceMetrics(
                    new MetricValue(180,  s.metrics().latency().baseline(),    "ms",    "up"),
                    new MetricValue(3.2,  s.metrics().errorRate().baseline(),  "%",     "up"),
                    new MetricValue(85,   s.metrics().retries().baseline(),    "/min",  "up"),
                    new MetricValue(950,  s.metrics().throughput().baseline(), "req/s", "down")
                ));
        }
        if (phase >= 2) {
            return withState(s, "critical", s.uptime() - 2.1,
                new ServiceMetrics(
                    new MetricValue(420,  s.metrics().latency().baseline(),    "ms",    "up"),
                    new MetricValue(12.8, s.metrics().errorRate().baseline(),  "%",     "up"),
                    new MetricValue(320,  s.metrics().retries().baseline(),    "/min",  "up"),
                    new MetricValue(580,  s.metrics().throughput().baseline(), "req/s", "down")
                ));
        }
        return s;
    }

    private ServiceInfo paymentState(ServiceInfo s, int phase) {
        if (phase == 2) {
            return withState(s, "degraded", s.uptime() - 0.8,
                new ServiceMetrics(
                    new MetricValue(980,  s.metrics().latency().baseline(),    "ms",    "up"),
                    new MetricValue(8.4,  s.metrics().errorRate().baseline(),  "%",     "up"),
                    new MetricValue(120,  s.metrics().retries().baseline(),    "/min",  "up"),
                    new MetricValue(180,  s.metrics().throughput().baseline(), "req/s", "down")
                ));
        }
        if (phase >= 3) {
            return withState(s, "critical", s.uptime() - 3.2,
                new ServiceMetrics(
                    new MetricValue(1800, s.metrics().latency().baseline(),    "ms",    "up"),
                    new MetricValue(24.6, s.metrics().errorRate().baseline(),  "%",     "up"),
                    new MetricValue(280,  s.metrics().retries().baseline(),    "/min",  "up"),
                    new MetricValue(45,   s.metrics().throughput().baseline(), "req/s", "down")
                ));
        }
        return s;
    }

    private ServiceInfo orderState(ServiceInfo s, int phase) {
        if (phase == 3) {
            return withState(s, "degraded", s.uptime() - 0.4,
                new ServiceMetrics(
                    new MetricValue(450, s.metrics().latency().baseline(),    "ms",    "up"),
                    new MetricValue(5.1, s.metrics().errorRate().baseline(),  "%",     "up"),
                    new MetricValue(60,  s.metrics().retries().baseline(),    "/min",  "up"),
                    new MetricValue(520, s.metrics().throughput().baseline(), "req/s", "down")
                ));
        }
        if (phase >= 4) {
            return withState(s, "critical", s.uptime() - 1.8,
                new ServiceMetrics(
                    new MetricValue(920,  s.metrics().latency().baseline(),    "ms",    "up"),
                    new MetricValue(18.2, s.metrics().errorRate().baseline(),  "%",     "up"),
                    new MetricValue(150,  s.metrics().retries().baseline(),    "/min",  "up"),
                    new MetricValue(210,  s.metrics().throughput().baseline(), "req/s", "down")
                ));
        }
        return s;
    }

    private ServiceInfo withState(ServiceInfo s, String status, double uptime, ServiceMetrics metrics) {
        return new ServiceInfo(
            s.id(), s.name(), s.shortName(), s.version(),
            status, uptime, s.color(), s.lastDeploy(), s.deployedBy(),
            metrics
        );
    }
}
