package com.rootcausex.model;

/**
 * A directed runtime dependency between two services.
 */
public record Dependency(
    String id,
    String source,
    String target,
    String label
) {}
