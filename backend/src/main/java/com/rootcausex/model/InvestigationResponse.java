package com.rootcausex.model;

import java.util.List;

/**
 * Phase 4 — Structured RCA response from AI investigation.
 *
 * id:                 UUID prefix — used by follow-up endpoint to retrieve stored context
 * title:              short incident title
 * probableRootCause:  detailed root cause explanation
 * affectedServices:   service IDs impacted (e.g. ["auth", "payment", "order"])
 * propagationPath:    ordered dependency chain of failure spread
 * supportingEvidence: specific metric/timing observations that support the RCA
 * recommendedActions: what to do next
 * confidenceScore:    0–100 based on evidence strength
 * reasoningSteps:     how the AI connected the evidence
 */
public record InvestigationResponse(
    String       id,
    String       title,
    String       probableRootCause,
    List<String> affectedServices,
    List<String> propagationPath,
    List<String> supportingEvidence,
    List<String> recommendedActions,
    int          confidenceScore,
    List<String> reasoningSteps
) {}
