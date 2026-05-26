package com.rootcausex.model;

import java.util.List;

/**
 * A single chronological event in the incident timeline.
 *
 * eventType: "DEPLOYMENT" | "DRIFT_DETECTED" | "ANOMALY"
 *            "SERVICE_DEGRADED" | "SERVICE_CRITICAL" | "CASCADE_PROPAGATION"
 *
 * severity:  "info" | "warning" | "critical"
 * phase:     which incident phase this event belongs to (0 = baseline)
 */
public record TimelineEvent(
    String       id,
    String       timestamp,
    String       eventType,
    String       severity,
    int          phase,
    String       title,
    String       description,
    List<String> affectedServices,
    String       relatedDeployment,   // nullable
    String       relatedAnomaly       // nullable
) {}
