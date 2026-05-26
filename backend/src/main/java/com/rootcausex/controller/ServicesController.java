package com.rootcausex.controller;

import com.rootcausex.model.Dependency;
import com.rootcausex.model.ServiceInfo;
import com.rootcausex.service.RuntimeDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * GET /services           — all services with full metrics
 * GET /services/{id}      — single service by id
 * GET /services/dependencies — dependency graph edges
 */
@RestController
@RequestMapping("/services")
public class ServicesController {

    private final RuntimeDataService runtimeDataService;

    public ServicesController(RuntimeDataService runtimeDataService) {
        this.runtimeDataService = runtimeDataService;
    }

    @GetMapping
    public List<ServiceInfo> getAllServices() {
        return runtimeDataService.getAllServices();
    }

    @GetMapping("/dependencies")
    public List<Dependency> getDependencies() {
        return runtimeDataService.getDependencies();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServiceInfo> getServiceById(@PathVariable String id) {
        return runtimeDataService.getServiceById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
