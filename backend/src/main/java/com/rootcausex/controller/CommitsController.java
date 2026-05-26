package com.rootcausex.controller;

import com.rootcausex.model.Commit;
import com.rootcausex.service.RuntimeDataService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * GET /commits              — full commit history across all services
 * GET /commits/{serviceId}  — commits scoped to a specific service
 *
 * Commits are the primary context source for AI investigation in Phase 4.
 */
@RestController
@RequestMapping("/commits")
public class CommitsController {

    private final RuntimeDataService runtimeDataService;

    public CommitsController(RuntimeDataService runtimeDataService) {
        this.runtimeDataService = runtimeDataService;
    }

    @GetMapping
    public List<Commit> getAllCommits() {
        return runtimeDataService.getAllCommits();
    }

    @GetMapping("/{serviceId}")
    public List<Commit> getCommitsByService(@PathVariable String serviceId) {
        return runtimeDataService.getCommitsByService(serviceId);
    }
}
