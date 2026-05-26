package com.rootcausex.service;

import com.rootcausex.model.*;
import com.rootcausex.repository.MockDataRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Runtime data service — business logic layer between controllers and the data layer.
 *
 * Phase 1: delegated directly to MockDataRepository (static data).
 * Phase 2: getAllServices() and getSystemStatus() now route through
 *          IncidentStateManager so live incident state is reflected
 *          in every API response automatically.
 *
 * Controllers are unchanged — only this layer changes.
 */
@Service
public class RuntimeDataService {

    private final MockDataRepository    repository;
    private final IncidentStateManager  incidentStateManager;

    public RuntimeDataService(MockDataRepository repository,
                              IncidentStateManager incidentStateManager) {
        this.repository           = repository;
        this.incidentStateManager = incidentStateManager;
    }

    // ── Services ──────────────────────────────────────────────────────────────

    /** Returns current live service state (reflects incident phase if active). */
    public List<ServiceInfo> getAllServices() {
        return incidentStateManager.getCurrentServices();
    }

    public Optional<ServiceInfo> getServiceById(String id) {
        return incidentStateManager.getCurrentServices().stream()
            .filter(s -> s.id().equals(id))
            .findFirst();
    }

    public List<Dependency> getDependencies() {
        return repository.getDependencies();
    }

    // ── Metrics ───────────────────────────────────────────────────────────────

    public Map<String, ServiceMetrics> getAllMetrics() {
        return incidentStateManager.getCurrentServices().stream()
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

    /** Returns live system status (reflects incident if active). */
    public SystemStatus getSystemStatus() {
        return incidentStateManager.getCurrentSystemStatus();
    }
}
