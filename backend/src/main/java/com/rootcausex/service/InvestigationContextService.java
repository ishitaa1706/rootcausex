package com.rootcausex.service;

import com.rootcausex.model.*;
import com.rootcausex.repository.MockDataRepository;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Phase 4 — InvestigationContextService.
 *
 * Aggregates ALL runtime context relevant to an investigation and formats it
 * as an AI-readable operational narrative. This narrative is sent to Claude
 * before every investigation — Claude never starts from a blank context.
 *
 * Gathers:
 *   - trigger anomaly or timeline event details
 *   - current service states + metrics (all 5 services)
 *   - dependency topology
 *   - recent deployments + commit messages
 *   - recent commits
 *   - chronological incident timeline
 *   - all active anomalies
 *   - incident phase + system status
 */
@Service
public class InvestigationContextService {

    private final RuntimeDataService    runtimeDataService;
    private final DriftDetectionService driftDetectionService;
    private final IncidentStateManager  incidentStateManager;
    private final TimelineService       timelineService;

    public InvestigationContextService(
        RuntimeDataService    runtimeDataService,
        DriftDetectionService driftDetectionService,
        IncidentStateManager  incidentStateManager,
        TimelineService       timelineService
    ) {
        this.runtimeDataService    = runtimeDataService;
        this.driftDetectionService = driftDetectionService;
        this.incidentStateManager  = incidentStateManager;
        this.timelineService       = timelineService;
    }

    /**
     * Builds a complete AI-readable investigation context narrative.
     * Either anomalyId or timelineEventId should be non-null.
     */
    public String buildContextNarrative(String anomalyId, String timelineEventId) {
        StringBuilder sb = new StringBuilder();

        sb.append("=== RUNTIME INVESTIGATION CONTEXT ===\n\n");

        // ── Investigation trigger ─────────────────────────────────────────────
        List<Anomaly> anomalies = driftDetectionService.detectAnomalies();

        if (anomalyId != null) {
            anomalies.stream()
                .filter(a -> a.id().equals(anomalyId))
                .findFirst()
                .ifPresent(a -> {
                    sb.append("INVESTIGATION TRIGGER\n");
                    sb.append("Anomaly ID:   ").append(a.id()).append("\n");
                    sb.append("Type:         ").append(a.anomalyType()).append("\n");
                    sb.append("Service:      ").append(a.serviceName()).append("\n");
                    sb.append("Severity:     ").append(a.severity().toUpperCase()).append("\n");
                    sb.append("Description:  ").append(a.description()).append("\n");
                    sb.append("Detected at:  ").append(a.timestamp()).append("\n\n");
                });
        }

        if (timelineEventId != null) {
            timelineService.getAllEvents().stream()
                .filter(e -> e.id().equals(timelineEventId))
                .findFirst()
                .ifPresent(e -> {
                    sb.append("INVESTIGATION TRIGGER\n");
                    sb.append("Timeline event: ").append(e.title()).append("\n");
                    sb.append("Type:           ").append(e.eventType()).append("\n");
                    sb.append("Severity:       ").append(e.severity().toUpperCase()).append("\n");
                    sb.append("Description:    ").append(e.description()).append("\n");
                    sb.append("Time:           ").append(e.timestamp()).append("\n\n");
                });
        }

        // ── Current service state ─────────────────────────────────────────────
        sb.append("CURRENT SERVICE STATE\n");
        for (ServiceInfo s : runtimeDataService.getAllServices()) {
            ServiceMetrics m = s.metrics();
            sb.append("- ").append(s.name())
              .append(": ").append(s.status().toUpperCase())
              .append(" | version: ").append(s.version())
              .append(" | deployed: ").append(s.lastDeploy()).append(" by ").append(s.deployedBy())
              .append("\n  latency: ").append(m.latency().current()).append("ms")
                .append(" (baseline: ").append(m.latency().baseline()).append("ms)")
              .append(" | errors: ").append(m.errorRate().current()).append("%")
                .append(" (baseline: ").append(m.errorRate().baseline()).append("%)")
              .append(" | retries: ").append(m.retries().current()).append("/min")
                .append(" (baseline: ").append(m.retries().baseline()).append("/min)")
              .append(" | throughput: ").append(m.throughput().current()).append(" req/s")
              .append("\n");
        }
        sb.append("\n");

        // ── Dependency topology ───────────────────────────────────────────────
        sb.append("DEPENDENCY TOPOLOGY\n");
        for (Dependency d : runtimeDataService.getDependencies()) {
            sb.append(d.source()).append(" → ").append(d.target())
              .append(" (").append(d.label()).append(")\n");
        }
        sb.append("\n");

        // ── Recent deployments ────────────────────────────────────────────────
        sb.append("RECENT DEPLOYMENTS\n");
        for (Deployment d : runtimeDataService.getAllDeployments()) {
            sb.append("[").append(d.timestamp()).append("] ")
              .append(d.serviceName()).append(" ").append(d.version())
              .append(" (prev: ").append(d.previousVersion()).append(")")
              .append(" · by ").append(d.author())
              .append(" · commit ").append(d.commit()).append("\n")
              .append("  Message: \"").append(d.message()).append("\"\n");
        }
        sb.append("\n");

        // ── Recent commits ────────────────────────────────────────────────────
        sb.append("RECENT COMMITS (last 10)\n");
        List<Commit> commits = runtimeDataService.getAllCommits().stream().limit(10).toList();
        for (Commit c : commits) {
            sb.append("[").append(c.timestamp()).append("] ")
              .append(c.id()).append(" by ").append(c.author())
              .append(" (").append(c.serviceName()).append(")")
              .append(": \"").append(c.message()).append("\"")
              .append(" [").append(c.type()).append("]\n");
        }
        sb.append("\n");

        // ── Incident timeline ─────────────────────────────────────────────────
        sb.append("INCIDENT TIMELINE (chronological)\n");
        for (TimelineEvent e : timelineService.getAllEvents()) {
            sb.append("[").append(e.timestamp()).append("] ")
              .append("[phase ").append(e.phase()).append("] ")
              .append(e.eventType()).append(": ")
              .append(e.title()).append(" — ").append(e.description()).append("\n");
        }
        sb.append("\n");

        // ── Active anomalies ──────────────────────────────────────────────────
        if (anomalies.isEmpty()) {
            sb.append("ACTIVE ANOMALIES: None detected\n");
        } else {
            sb.append("ACTIVE ANOMALIES (").append(anomalies.size()).append(" detected)\n");
            for (Anomaly a : anomalies) {
                sb.append("[").append(a.severity().toUpperCase()).append("] ")
                  .append(a.anomalyType()).append(" on ").append(a.serviceName())
                  .append(" at ").append(a.timestamp())
                  .append(": ").append(a.description()).append("\n");
            }
        }
        sb.append("\n");

        // ── Incident phase + system status ────────────────────────────────────
        SystemStatus sys = runtimeDataService.getSystemStatus();
        sb.append("INCIDENT PHASE: ").append(incidentStateManager.currentPhase())
          .append(incidentStateManager.isActive() ? " (ACTIVE)" : " (NOT ACTIVE)").append("\n");
        sb.append("SYSTEM STATUS: ").append(sys.status().toUpperCase()).append("\n");
        sb.append("SERVICES HEALTHY: ").append(sys.servicesHealthy())
          .append("/").append(sys.servicesTotal()).append("\n");
        sb.append("SYSTEM ERROR RATE: ").append(sys.errorRate()).append("%\n");
        sb.append("SYSTEM P99 LATENCY: ").append(sys.p99Latency()).append("ms\n");

        return sb.toString();
    }
}
