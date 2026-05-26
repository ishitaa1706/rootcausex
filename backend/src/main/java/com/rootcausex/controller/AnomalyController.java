package com.rootcausex.controller;

import com.rootcausex.model.Anomaly;
import com.rootcausex.service.DriftDetectionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * GET /anomalies — all detected runtime anomalies (empty when system is healthy)
 */
@RestController
@RequestMapping("/anomalies")
public class AnomalyController {

    private final DriftDetectionService driftDetectionService;

    public AnomalyController(DriftDetectionService driftDetectionService) {
        this.driftDetectionService = driftDetectionService;
    }

    @GetMapping
    public List<Anomaly> getAnomalies() {
        return driftDetectionService.detectAnomalies();
    }
}
