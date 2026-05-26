package com.rootcausex.controller;

import com.rootcausex.model.ServiceMetrics;
import com.rootcausex.service.RuntimeDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * GET /metrics            — all service metrics (serviceId → metrics map)
 * GET /metrics/{serviceId} — metrics for a specific service
 */
@RestController
@RequestMapping("/metrics")
public class MetricsController {

    private final RuntimeDataService runtimeDataService;

    public MetricsController(RuntimeDataService runtimeDataService) {
        this.runtimeDataService = runtimeDataService;
    }

    @GetMapping
    public Map<String, ServiceMetrics> getAllMetrics() {
        return runtimeDataService.getAllMetrics();
    }

    @GetMapping("/{serviceId}")
    public ResponseEntity<ServiceMetrics> getMetricsByService(@PathVariable String serviceId) {
        return runtimeDataService.getMetricsByServiceId(serviceId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
