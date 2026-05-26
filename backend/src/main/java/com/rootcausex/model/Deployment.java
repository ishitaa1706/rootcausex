package com.rootcausex.model;

/**
 * A production deployment event for a service.
 *
 * type: "feature" | "improvement" | "fix" | "refactor" | "hotfix"
 */
public record Deployment(
    int id,
    String service,
    String serviceName,
    String version,
    String previousVersion,
    String timestamp,
    String author,
    String commit,
    String message,
    String type
) {}
