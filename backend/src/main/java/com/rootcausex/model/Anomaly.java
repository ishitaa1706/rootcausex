package com.rootcausex.model;

/**
 * A detected runtime anomaly, emitted by the DriftDetectionService.
 *
 * severity:    "warning" | "critical"
 * anomalyType: "LATENCY_DRIFT" | "RETRY_AMPLIFICATION" | "ERROR_SPIKE"
 *              "THROUGHPUT_COLLAPSE" | "DEPENDENCY_INSTABILITY"
 */
public record Anomaly(
    String id,
    String timestamp,
    String severity,
    String affectedService,
    String serviceName,
    String anomalyType,
    String description
) {}
