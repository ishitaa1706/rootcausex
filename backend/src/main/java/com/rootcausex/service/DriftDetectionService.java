package com.rootcausex.service;

import com.rootcausex.model.Anomaly;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Drift detection engine — generates Anomaly events based on the current
 * incident phase. Timestamps are anchored to the actual trigger time so
 * the feed reads like a real production incident log.
 *
 * This is intentionally stateless: the anomaly list is computed on demand
 * from the IncidentStateManager's elapsed time.
 */
@Service
public class DriftDetectionService {

    private static final DateTimeFormatter FMT =
        DateTimeFormatter.ofPattern("h:mm a");

    private final IncidentStateManager manager;

    public DriftDetectionService(IncidentStateManager manager) {
        this.manager = manager;
    }

    public List<Anomaly> detectAnomalies() {
        if (!manager.isActive()) return List.of();

        int phase     = manager.currentPhase();
        Instant start = manager.getTriggeredAt();

        String t1 = fmt(start);                     // incident trigger
        String t2 = fmt(start.plusSeconds(20));     // phase 2 onset
        String t3 = fmt(start.plusSeconds(40));     // phase 3 onset

        List<Anomaly> list = new ArrayList<>();

        // ── Phase 1 — auth DEGRADED ──────────────────────────────────────────
        if (phase >= 1) {
            list.add(new Anomaly(
                "anm-001", t1, "warning",
                "auth", "Auth Service",
                "RETRY_AMPLIFICATION",
                "Retry rate 750% above baseline — 85/min vs baseline 10/min. " +
                "Backoff policy introduced in v2.1 amplifying under peak load."
            ));
            list.add(new Anomaly(
                "anm-002", t1, "warning",
                "auth", "Auth Service",
                "LATENCY_DRIFT",
                "p99 latency drifted 42ms → 180ms (+329%). " +
                "Correlated with auth-service v2.1 deployment 2h ago (commit a1b2c3d)."
            ));
        }

        // ── Phase 2 — auth CRITICAL, payment DEGRADED ────────────────────────
        if (phase >= 2) {
            list.add(new Anomaly(
                "anm-003", t1, "critical",
                "auth", "Auth Service",
                "ERROR_SPIKE",
                "Error rate critical: 12.8% (baseline: 0.10%). " +
                "Auth producing retry storms — downstream services absorbing overflow."
            ));
            list.add(new Anomaly(
                "anm-004", t2, "warning",
                "payment", "Payment Service",
                "DEPENDENCY_INSTABILITY",
                "Upstream auth-service instability propagating via JWT validate dependency. " +
                "Payment latency amplifying as auth retries queue."
            ));
            list.add(new Anomaly(
                "anm-005", t2, "warning",
                "payment", "Payment Service",
                "LATENCY_DRIFT",
                "Payment p99 latency spiked 115ms → 980ms (+752%). " +
                "Queue contention visible — downstream order processing slowing."
            ));
        }

        // ── Phase 3 — payment CRITICAL, order DEGRADED ───────────────────────
        if (phase >= 3) {
            list.add(new Anomaly(
                "anm-006", t2, "critical",
                "payment", "Payment Service",
                "RETRY_AMPLIFICATION",
                "Payment retrying auth calls at 280x/min. " +
                "Exponential amplification — queue saturation imminent."
            ));
            list.add(new Anomaly(
                "anm-007", t2, "critical",
                "payment", "Payment Service",
                "THROUGHPUT_COLLAPSE",
                "Throughput collapsed 350 → 45 req/s (−87%). " +
                "Service approaching failure threshold."
            ));
            list.add(new Anomaly(
                "anm-008", t3, "warning",
                "order", "Order Service",
                "DEPENDENCY_INSTABILITY",
                "Order receiving degraded responses from 2 upstream dependencies " +
                "(auth: CRITICAL, payment: CRITICAL). Cascading failure in progress."
            ));
        }

        // ── Phase 4 — full cascade ────────────────────────────────────────────
        if (phase >= 4) {
            list.add(new Anomaly(
                "anm-009", t3, "critical",
                "order", "Order Service",
                "ERROR_SPIKE",
                "Order service error rate critical: 18.2%. " +
                "Full cascade from auth retry amplification — all upstream paths degraded."
            ));
            list.add(new Anomaly(
                "anm-010", t3, "critical",
                "order", "Order Service",
                "LATENCY_DRIFT",
                "Order latency 92ms → 920ms (+900%). Complete dependency chain failure. " +
                "Root cause: auth-service v2.1 retry policy under peak load."
            ));
        }

        Collections.reverse(list); // most recent first
        return list;
    }

    private String fmt(Instant instant) {
        return LocalDateTime.ofInstant(instant, ZoneId.systemDefault()).format(FMT);
    }
}
