package com.rootcausex.service;

import com.rootcausex.model.*;
import com.rootcausex.repository.MockDataRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Runtime data service — business logic layer between controllers and the mock data repository.
 *
 * Kept intentionally thin for Phase 1.
 * Phase 2 (Drift Detection) will add state mutation, anomaly scoring, and incident simulation here.
 */
@Service
public class RuntimeDataService {

    private final MockDataRepository repository;

    public RuntimeDataService(MockDataRepository repository) {
        this.repository = repository;
    }

    // ── Services ──────────────────────────────────────────────────────────────

    public List<ServiceInfo> getAllServices() {
        return repository.getServices();
    }

    public Optional<ServiceInfo> getServiceById(String id) {
        return repository.getServices().stream()
            .filter(s -> s.id().equals(id))
            .findFirst();
    }

    public List<Dependency> getDependencies() {
        return repository.getDependencies();
    }

    // ── Metrics ───────────────────────────────────────────────────────────────

    /**
     * Returns a map of serviceId → ServiceMetrics for all services.
     * Useful for the frontend to get a lightweight metrics snapshot
     * without the full service descriptor payload.
     */
    public Map<String, ServiceMetrics> getAllMetrics() {
        return repository.getServices().stream()
            .collect(Collectors.toMap(ServiceInfo::id, ServiceInfo::metrics));
    }

    public Optional<ServiceMetrics> getMetricsByServiceId(String serviceId) {
        return getServiceById(serviceId).map(ServiceInfo::metrics);
    }

    // ── Deployments ───────────────────────────────────────────────────────────

    public List<Deployment> getAllDeployments() {
        return repository.getDeployments();
    }

    public List<Deployment> getDeploymentsByService(String serviceId) {
        return repository.getDeployments().stream()
            .filter(d -> d.service().equals(serviceId))
            .toList();
    }

    // ── Commits ───────────────────────────────────────────────────────────────

    public List<Commit> getAllCommits() {
        return repository.getCommits();
    }

    public List<Commit> getCommitsByService(String serviceId) {
        return repository.getCommits().stream()
            .filter(c -> c.service().equals(serviceId))
            .toList();
    }

    // ── System ────────────────────────────────────────────────────────────────

    public SystemStatus getSystemStatus() {
        return repository.getSystemStatus();
    }
}
