package com.rootcausex.model;

import java.util.List;

/**
 * Full dashboard snapshot for a specific incident phase.
 * Returned by GET /timeline/playback-state/{phase}.
 *
 * The frontend uses this to freeze the dashboard at a point in time
 * while the user scrubs through the incident timeline.
 */
public record PlaybackState(
    int              phase,
    String           phaseName,
    String           phaseDescription,
    List<ServiceInfo> services,
    SystemStatus     systemStatus,
    List<String>     affectedServices,
    List<String>     activeEventIds     // which timeline events are "live" at this phase
) {}
