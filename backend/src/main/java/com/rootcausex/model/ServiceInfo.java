package com.rootcausex.model;

/**
 * Full service descriptor including identity, runtime health, and current metrics.
 *
 * status: "healthy" | "degraded" | "critical"
 */
public record ServiceInfo(
    String id,
    String name,
    String shortName,
    String version,
    String status,
    double uptime,
    String color,
    String lastDeploy,
    String deployedBy,
    ServiceMetrics metrics
) {}
