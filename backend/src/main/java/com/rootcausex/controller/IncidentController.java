package com.rootcausex.controller;

import com.rootcausex.model.IncidentStatus;
import com.rootcausex.service.IncidentStateManager;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * POST /incident/trigger  — start the incident simulation
 * POST /incident/reset    — restore healthy baseline
 * GET  /incident/status   — current incident state
 */
@RestController
@RequestMapping("/incident")
public class IncidentController {

    private final IncidentStateManager manager;

    public IncidentController(IncidentStateManager manager) {
        this.manager = manager;
    }

    @PostMapping("/trigger")
    public Map<String, Object> trigger() {
        manager.trigger();
        return Map.of(
            "triggered", true,
            "message", "Incident simulation started — auth-service retry amplification active"
        );
    }

    @PostMapping("/reset")
    public Map<String, Object> reset() {
        manager.reset();
        return Map.of(
            "reset", true,
            "message", "System reset to healthy baseline"
        );
    }

    @GetMapping("/status")
    public IncidentStatus status() {
        return manager.getStatus();
    }
}
