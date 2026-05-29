package com.rootcausex.model;

/**
 * Request body for POST /runtime/query.
 *
 * query               — free-form operational question
 * investigationContext — optional context string from the frontend
 *                        (e.g. "AI investigation active for auth RETRY_AMPLIFICATION")
 *                        appended to the prompt so Claude can reason about it.
 */
public record RuntimeQueryRequest(
    String query,
    String investigationContext
) {}
