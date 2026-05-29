package com.rootcausex.model;

import java.util.List;

/**
 * Response for POST /runtime/query.
 *
 * summary            — operational answer, 2–4 sentences, specific and forensic
 * evidence           — list of raw signal observations that support the answer
 * services           — service IDs referenced in the answer
 * relatedDeployments — recent deployments relevant to the query
 * confidence         — 0.0–1.0 confidence in the answer
 */
public record RuntimeQueryResponse(
    String       summary,
    List<String> evidence,
    List<String> services,
    List<String> relatedDeployments,
    double       confidence
) {}
