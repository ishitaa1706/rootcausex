package com.rootcausex.model;

/**
 * Full runtime metrics snapshot for a single service.
 */
public record ServiceMetrics(
    MetricValue latency,
    MetricValue errorRate,
    MetricValue retries,
    MetricValue throughput
) {}
