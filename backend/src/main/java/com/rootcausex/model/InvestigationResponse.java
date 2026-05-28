package com.rootcausex.model;

import java.util.List;

/**
 * Phase 4 — Structured RCA response from AI investigation.
 *
 * id:                     UUID prefix — used by follow-up endpoint to retrieve stored context
 * title:                  short incident title
 * severity:               "P0" | "P1" | "P2" — incident severity classification
 *                         P0 = complete outage / critical user path broken
 *                         P1 = major degradation, most users impacted
 *                         P2 = partial degradation, subset of users impacted
 * endUserImpact:          plain-English description of what end users are experiencing
 * probableRootCause:      detailed root cause explanation referencing real evidence
 * affectedServices:       service IDs impacted (e.g. ["auth", "payment", "order"])
 * propagationPath:        ordered dependency chain of failure spread
 * supportingEvidence:     specific metric/timing observations supporting the RCA
 * correlatedDeployments:  deployments temporally or causally linked, with time-gap notes
 * recommendedActions:     prioritised actions to resolve the incident
 * confidenceScore:        0–100 based on evidence strength
 * reasoningSteps:         how the AI connected the evidence (used in Phase 5 cognition stream)
 */
public record InvestigationResponse(
    String       id,
    String       title,
    String       severity,
    String       endUserImpact,
    String       probableRootCause,
    List<String> affectedServices,
    List<String> propagationPath,
    List<String> supportingEvidence,
    List<String> correlatedDeployments,
    List<String> recommendedActions,
    int          confidenceScore,
    List<String> reasoningSteps
) {}
