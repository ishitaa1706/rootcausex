package com.rootcausex.model;

/**
 * Phase 4 — Investigation trigger.
 * Either anomalyId or timelineEventId must be provided.
 */
public record InvestigationRequest(
    String anomalyId,
    String timelineEventId
) {}
