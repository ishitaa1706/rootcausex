package com.rootcausex.model;

/**
 * Phase 4 — Follow-up investigation question.
 * investigationId ties back to the original RCA context stored in AIInvestigationService.
 */
public record FollowUpRequest(
    String investigationId,
    String question
) {}
