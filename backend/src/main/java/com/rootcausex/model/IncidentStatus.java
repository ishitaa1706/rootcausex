package com.rootcausex.model;

import java.util.List;

/**
 * Snapshot of the current incident state.
 *
 * phase:      "HEALTHY" | "DEGRADED" | "CRITICAL"
 * phaseIndex: 0 (healthy) → 1 → 2 → 3 → 4 (full cascade)
 */
public record IncidentStatus(
    boolean active,
    String phase,
    int phaseIndex,
    String triggeredAt,
    long elapsedSeconds,
    List<String> affectedServices
) {}
