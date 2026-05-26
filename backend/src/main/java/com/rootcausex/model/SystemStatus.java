package com.rootcausex.model;

/**
 * Aggregated runtime health summary across all services.
 *
 * status: "healthy" | "degraded" | "incident"
 */
public record SystemStatus(
    String status,
    int activeIncidents,
    int servicesHealthy,
    int servicesTotal,
    double p99Latency,
    double errorRate,
    double totalThroughput
) {}
