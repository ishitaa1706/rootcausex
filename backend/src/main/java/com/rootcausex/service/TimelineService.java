package com.rootcausex.service;

import com.rootcausex.model.*;
import com.rootcausex.repository.MockDataRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Timeline service for Phase 3 — Runtime Context.
 *
 * Builds the chronological incident story as TimelineEvents and
 * produces PlaybackState snapshots so the frontend can reconstruct
 * system evolution at any point in the incident.
 *
 * All timestamps are fixed demo times (6:XX PM) representing
 * the canonical incident story — "every evening between 6–7 PM."
 */
@Service
public class TimelineService {

    private final IncidentStateManager manager;
    private final MockDataRepository   repository;

    public TimelineService(IncidentStateManager manager, MockDataRepository repository) {
        this.manager    = manager;
        this.repository = repository;
    }

    // ── Timeline events ───────────────────────────────────────────────────────

    public List<TimelineEvent> getAllEvents() {
        return EVENTS;
    }

    public List<TimelineEvent> getEventsUpToPhase(int phase) {
        return EVENTS.stream()
            .filter(e -> e.phase() <= phase)
            .toList();
    }

    // ── Playback state ────────────────────────────────────────────────────────

    public PlaybackState getPlaybackState(int phase) {
        int p = Math.max(0, Math.min(4, phase));

        List<String> activeEventIds = EVENTS.stream()
            .filter(e -> e.phase() <= p)
            .map(TimelineEvent::id)
            .toList();

        List<String> affected = switch (p) {
            case 0 -> List.of();
            case 1 -> List.of("auth");
            case 2 -> List.of("auth", "payment");
            default -> List.of("auth", "payment", "order");
        };

        return new PlaybackState(
            p,
            PHASE_NAMES[p],
            PHASE_DESCRIPTIONS[p],
            manager.getServicesForPhase(p),
            manager.getSystemStatusForPhase(p),
            affected,
            activeEventIds
        );
    }

    // ── Deployment correlation ────────────────────────────────────────────────

    public Optional<Map<String, Object>> getCorrelation(int deploymentId) {
        return switch (deploymentId) {
            case 1 -> Optional.of(Map.of(
                "deploymentId",     1,
                "service",          "auth",
                "version",          "v2.1",
                "deployedAt",       "6:00 PM",
                "anomalyOnsetMins", 8,
                "relatedAnomalies", List.of("anm-001", "anm-002", "anm-003")
            ));
            case 2 -> Optional.of(Map.of(
                "deploymentId",     2,
                "service",          "payment",
                "version",          "v1.8",
                "deployedAt",       "6:02 PM",
                "anomalyOnsetMins", 13,
                "relatedAnomalies", List.of("anm-004", "anm-005", "anm-006", "anm-007")
            ));
            default -> Optional.empty();
        };
    }

    // ── Static incident story ─────────────────────────────────────────────────

    private static final String[] PHASE_NAMES = {
        "HEALTHY",
        "INITIAL DRIFT",
        "PARTIAL CASCADE",
        "ESCALATION",
        "FULL CASCADE"
    };

    private static final String[] PHASE_DESCRIPTIONS = {
        "All services operational. auth-service v2.1 recently deployed.",
        "auth-service retry amplification detected. Latency drifting above baseline.",
        "auth-service critical. Payment-service beginning to degrade under load.",
        "auth and payment services critical. Order-service cascade propagation active.",
        "Full dependency chain failure. All downstream services in critical state."
    };

    private static final List<TimelineEvent> EVENTS = List.of(

        // ── Phase 0 — Baseline ────────────────────────────────────────────────
        new TimelineEvent(
            "evt-001", "6:00 PM", "DEPLOYMENT", "info", 0,
            "auth-service v2.1 deployed",
            "Introduced exponential backoff retry policy for downstream calls. " +
            "Deployed by alice · commit a1b2c3d.",
            List.of("auth"), "1", null
        ),
        new TimelineEvent(
            "evt-002", "6:02 PM", "DEPLOYMENT", "info", 0,
            "payment-service v1.8 deployed",
            "Latency optimization under load. " +
            "Deployed by bob · commit e4f5g6h.",
            List.of("payment"), "2", null
        ),

        // ── Phase 1 — Auth degraded ───────────────────────────────────────────
        new TimelineEvent(
            "evt-003", "6:08 PM", "DRIFT_DETECTED", "warning", 1,
            "Retry amplification detected — auth-service",
            "Retry rate: 85/min (baseline: 10/min, +750%)",
            List.of("auth"), "1", "anm-001"
        ),
        new TimelineEvent(
            "evt-004", "6:10 PM", "ANOMALY", "warning", 1,
            "Latency drift — auth-service",
            "p99 latency: 42ms → 180ms (+329% above baseline)",
            List.of("auth"), null, "anm-002"
        ),
        new TimelineEvent(
            "evt-005", "6:12 PM", "SERVICE_DEGRADED", "warning", 1,
            "auth-service → DEGRADED",
            "Service health transitioned to DEGRADED. Thread pool utilization: 94%",
            List.of("auth"), null, null
        ),

        // ── Phase 2 — Auth critical, payment degraded ─────────────────────────
        new TimelineEvent(
            "evt-006", "6:15 PM", "ANOMALY", "warning", 2,
            "Latency drift — payment-service",
            "p99 latency: 115ms → 980ms (+752% above baseline). " +
            "Auth dependency call failures: 34%",
            List.of("auth", "payment"), null, "anm-005"
        ),
        new TimelineEvent(
            "evt-007", "6:17 PM", "SERVICE_CRITICAL", "critical", 2,
            "auth-service → CRITICAL",
            "Error rate: 12.8% (baseline: 0.10%). Outbound retry rate: 320/min",
            List.of("auth"), null, "anm-003"
        ),
        new TimelineEvent(
            "evt-008", "6:18 PM", "SERVICE_DEGRADED", "warning", 2,
            "payment-service → DEGRADED",
            "Throughput: 350 → 180 req/s (−49%). Auth dependency timeout rate: 28%",
            List.of("payment"), null, "anm-004"
        ),

        // ── Phase 3 — Payment critical, order degraded ────────────────────────
        new TimelineEvent(
            "evt-009", "6:20 PM", "CASCADE_PROPAGATION", "critical", 3,
            "Multi-service degradation — auth, payment, order",
            "order-service receiving degraded responses from 2 upstream dependencies. " +
            "Auth dependency: CRITICAL, payment dependency: CRITICAL",
            List.of("auth", "payment", "order"), null, "anm-008"
        ),
        new TimelineEvent(
            "evt-010", "6:22 PM", "SERVICE_CRITICAL", "critical", 3,
            "payment-service → CRITICAL",
            "Throughput: 350 → 45 req/s (−87%). Retry rate against auth: 280/min",
            List.of("payment"), null, "anm-007"
        ),
        new TimelineEvent(
            "evt-011", "6:25 PM", "SERVICE_DEGRADED", "warning", 3,
            "order-service → DEGRADED",
            "Latency: 92ms → 450ms (+389%). Upstream health checks: 2/2 failing",
            List.of("order"), null, null
        ),

        // ── Phase 4 — Full cascade ────────────────────────────────────────────
        new TimelineEvent(
            "evt-012", "6:28 PM", "SERVICE_CRITICAL", "critical", 4,
            "order-service → CRITICAL",
            "Error rate: 18.2% (baseline: 0.12%). Latency: 920ms. " +
            "All upstream dependencies in CRITICAL state.",
            List.of("order"), null, "anm-009"
        ),
        new TimelineEvent(
            "evt-013", "6:28 PM", "CASCADE_PROPAGATION", "critical", 4,
            "Full dependency chain failure",
            "auth, payment, order all CRITICAL simultaneously. " +
            "Incident duration: ~28 minutes from first deployment to full cascade.",
            List.of("auth", "payment", "order"), "1", "anm-010"
        )
    );
}
