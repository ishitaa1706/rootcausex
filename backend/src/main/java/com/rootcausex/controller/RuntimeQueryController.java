package com.rootcausex.controller;

import com.rootcausex.model.RuntimeQueryRequest;
import com.rootcausex.model.RuntimeQueryResponse;
import com.rootcausex.service.RuntimeQueryService;
import org.springframework.web.bind.annotation.*;

/**
 * POST /runtime/query
 *
 * Accepts a free-form operational question and returns a structured,
 * runtime-aware answer. Full runtime context (services, anomalies,
 * deployments, commits, topology, timeline) is gathered automatically —
 * the caller does NOT need to supply context.
 */
@RestController
@RequestMapping("/runtime")
public class RuntimeQueryController {

    private final RuntimeQueryService service;

    public RuntimeQueryController(RuntimeQueryService service) {
        this.service = service;
    }

    @PostMapping("/query")
    public RuntimeQueryResponse query(@RequestBody RuntimeQueryRequest request) {
        return service.query(
            request.query(),
            request.investigationContext()
        );
    }
}
