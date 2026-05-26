package com.rootcausex.model;

/**
 * A git commit associated with a service, used for deployment correlation and AI investigation context.
 *
 * type: "feature" | "fix" | "refactor" | "config" | "improvement"
 */
public record Commit(
    String id,
    String service,
    String serviceName,
    String author,
    String timestamp,
    String message,
    String hash,
    String branch,
    String type
) {}
