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
                "Retry rate: 85/min (baseline: 10/min, +750%)"
            ));
            list.add(new Anomaly(
                "anm-002", t1, "warning",
                "auth", "Auth Service",
                "LATENCY_DRIFT",
                "p99 latency: 42ms → 180ms (+329% above baseline)"
            ));
        }

        // ── Phase 2 — auth CRITICAL, payment DEGRADED ────────────────────────
        if (phase >= 2) {
            list.add(new Anomaly(
                "anm-003", t1, "critical",
                "auth", "Auth Service",
                "ERROR_SPIKE",
                "Error rate: 12.8% (baseline: 0.10%, +12,700%)"
            ));
            list.add(new Anomaly(
                "anm-004", t2, "warning",
                "payment", "Payment Service",
                "DEPENDENCY_INSTABILITY",
                "Auth dependency call latency: 1,240ms p99. Dependency error rate: 34%"
            ));
            list.add(new Anomaly(
                "anm-005", t2, "warning",
                "payment", "Payment Service",
                "LATENCY_DRIFT",
                "p99 latency: 115ms → 980ms (+752% above baseline)"
            ));
        }

        // ── Phase 3 — payment CRITICAL, order DEGRADED ───────────────────────
        if (phase >= 3) {
            list.add(new Anomaly(
                "anm-006", t2, "critical",
                "payment", "Payment Service",
                "RETRY_AMPLIFICATION",
                "Retry rate against auth dependency: 280/min (baseline: 12/min)"
            ));
            list.add(new Anomaly(
                "anm-007", t2, "critical",
                "payment", "Payment Service",
                "THROUGHPUT_COLLAPSE",
                "Throughput: 350 → 45 req/s (−87%)"
            ));
            list.add(new Anomaly(
                "anm-008", t3, "warning",
                "order", "Order Service",
                "DEPENDENCY_INSTABILITY",
                "Upstream status — auth-service: CRITICAL, payment-service: CRITICAL. " +
                "Dependency timeout rate: 68%"
            ));
        }

        // ── Phase 4 — full cascade ────────────────────────────────────────────
        if (phase >= 4) {
            list.add(new Anomaly(
                "anm-009", t3, "critical",
                "order", "Order Service",
                "ERROR_SPIKE",
                "Error rate: 18.2% (baseline: 0.12%). All upstream health checks failing."
            ));
            list.add(new Anomaly(
                "anm-010", t3, "critical",
                "order", "Order Service",
                "LATENCY_DRIFT",
                "p99 latency: 92ms → 920ms (+900% above baseline). " +
                "94% of requests timing out at dependency layer."
            ));
        }

        Collections.reverse(list); // most recent first
        return list;
    }

    private String fmt(Instant instant) {
        return LocalDateTime.ofInstant(instant, ZoneId.systemDefault()).format(FMT);
    }
}
