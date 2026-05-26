package com.rootcausex.model;

/**
 * A single runtime metric observation with its baseline for drift comparison.
 *
 * trend: "up" | "down" | "stable"
 */
public record MetricValue(
    double current,
    double baseline,
    String unit,
    String trend
) {}
