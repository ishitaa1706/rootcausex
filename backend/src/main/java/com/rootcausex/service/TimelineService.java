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
                "deploymentId",    1,
                "service",         "auth",
                "version",         "v2.1",
                "affectedServices", List.of("auth", "payment", "order"),
                "relatedAnomalies", List.of("anm-001", "anm-002", "anm-003"),
                "causalChain",     "auth → payment → order",
                "rootCause",       "Exponential backoff retry policy amplifies under peak load"
            ));
            case 2 -> Optional.of(Map.of(
                "deploymentId",    2,
                "service",         "payment",
                "version",         "v1.8",
                "affectedServices", List.of("payment", "order"),
                "relatedAnomalies", List.of("anm-004", "anm-005", "anm-006", "anm-007"),
                "causalChain",     "payment → order",
                "rootCause",       "Payment service degraded by upstream auth instability"
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
            "Retry rate 85/min (baseline: 10/min, +750%). " +
            "v2.1 backoff policy amplifying under peak traffic load.",
            List.of("auth"), "1", "anm-001"
        ),
        new TimelineEvent(
            "evt-004", "6:10 PM", "ANOMALY", "warning", 1,
            "Latency drift — auth-service",
            "p99 latency 42ms → 180ms (+329%). " +
            "Correlated with retry amplification onset.",
            List.of("auth"), null, "anm-002"
        ),
        new TimelineEvent(
            "evt-005", "6:12 PM", "SERVICE_DEGRADED", "warning", 1,
            "auth-service → DEGRADED",
            "Service health transitioned to DEGRADED. " +
            "Retry storms consuming available thread pool capacity.",
            List.of("auth"), null, null
        ),

        // ── Phase 2 — Auth critical, payment degraded ─────────────────────────
        new TimelineEvent(
            "evt-006", "6:15 PM", "ANOMALY", "warning", 2,
            "Latency drift — payment-service",
            "payment p99 latency 115ms → 980ms (+752%). " +
            "Upstream auth instability propagating via JWT validate dependency.",
            List.of("auth", "payment"), null, "anm-005"
        ),
        new TimelineEvent(
            "evt-007", "6:17 PM", "SERVICE_CRITICAL", "critical", 2,
            "auth-service → CRITICAL",
            "Error rate 12.8% (baseline: 0.10%). " +
            "auth-service producing upstream retry storms at 320/min.",
            List.of("auth"), null, "anm-003"
        ),
        new TimelineEvent(
            "evt-008", "6:18 PM", "SERVICE_DEGRADED", "warning", 2,
            "payment-service → DEGRADED",
            "Queue contention from auth retries. " +
            "Throughput reduced 350 → 180 req/s. " +
            "Downstream order-service beginning to slow.",
            List.of("payment"), null, "anm-004"
        ),

        // ── Phase 3 — Payment critical, order degraded ────────────────────────
        new TimelineEvent(
            "evt-009", "6:20 PM", "CASCADE_PROPAGATION", "critical", 3,
            "Cascade propagation: auth → payment → order",
            "Retry amplification cascade confirmed. " +
            "Failure propagating through dependency chain. " +
            "order-service receiving degraded responses from 2 upstream dependencies.",
            List.of("auth", "payment", "order"), null, "anm-008"
        ),
        new TimelineEvent(
            "evt-010", "6:22 PM", "SERVICE_CRITICAL", "critical", 3,
            "payment-service → CRITICAL",
            "Throughput collapsed 350 → 45 req/s (−87%). " +
            "Retrying auth at 280/min. Queue saturation.",
            List.of("payment"), null, "anm-007"
        ),
        new TimelineEvent(
            "evt-011", "6:25 PM", "SERVICE_DEGRADED", "warning", 3,
            "order-service → DEGRADED",
            "Cascading instability from auth + payment. " +
            "Latency 92ms → 450ms. Processing queue backing up.",
            List.of("order"), null, null
        ),

        // ── Phase 4 — Full cascade ────────────────────────────────────────────
        new TimelineEvent(
            "evt-012", "6:28 PM", "SERVICE_CRITICAL", "critical", 4,
            "order-service → CRITICAL",
            "Full cascade complete. Error rate 18.2%. " +
            "Latency 920ms. All upstream dependencies in CRITICAL state.",
            List.of("order"), null, "anm-009"
        ),
        new TimelineEvent(
            "evt-013", "6:28 PM", "CASCADE_PROPAGATION", "critical", 4,
            "Full dependency chain failure",
            "Root cause: auth-service v2.1 retry amplification under peak load. " +
            "Cascaded: auth → payment → order. " +
            "Incident duration: ~28 minutes from deployment to full cascade.",
            List.of("auth", "payment", "order"), "1", "anm-010"
        )
    );
}
