package com.rootcausex.controller;

import com.rootcausex.model.Deployment;
import com.rootcausex.service.RuntimeDataService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * GET /deployments              — all deployment events
 * GET /deployments/{serviceId}  — deployments for a specific service
 */
@RestController
@RequestMapping("/deployments")
public class DeploymentsController {

    private final RuntimeDataService runtimeDataService;

    public DeploymentsController(RuntimeDataService runtimeDataService) {
        this.runtimeDataService = runtimeDataService;
    }

    @GetMapping
    public List<Deployment> getAllDeployments() {
        return runtimeDataService.getAllDeployments();
    }

    @GetMapping("/{serviceId}")
    public List<Deployment> getDeploymentsByService(@PathVariable String serviceId) {
        return runtimeDataService.getDeploymentsByService(serviceId);
    }
}
