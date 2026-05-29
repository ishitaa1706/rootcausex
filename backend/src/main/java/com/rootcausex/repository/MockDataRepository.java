package com.rootcausex.repository;

import com.rootcausex.model.*;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * In-memory mock runtime data store.
 *
 * Simulates a live production environment for the RootCauseX demo.
 * No database — intentional. This is a believable runtime world, not infrastructure.
 *
 * Data mirrors the frontend mockData.js exactly so the frontend can swap
 * its static import for these API calls without any component changes.
 */
@Repository
public class MockDataRepository {

    private final List<ServiceInfo>  services;
    private final List<Dependency>   dependencies;
    private final List<Deployment>   deployments;
    private final List<Commit>       commits;
    private final SystemStatus       systemStatus;

    public MockDataRepository() {
        this.services     = buildServices();
        this.dependencies = buildDependencies();
        this.deployments  = buildDeployments();
        this.commits      = buildCommits();
        this.systemStatus = buildSystemStatus();
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    public List<ServiceInfo>  getServices()     { return services;     }
    public List<Dependency>   getDependencies() { return dependencies; }
    public List<Deployment>   getDeployments()  { return deployments;  }
    public List<Commit>       getCommits()      { return commits;      }
    public SystemStatus       getSystemStatus() { return systemStatus; }

    // ── Mock data builders ────────────────────────────────────────────────────

    private List<ServiceInfo> buildServices() {
        return List.of(

            new ServiceInfo(
                // v2.4 is the latest deployment (1h ago, JWT signing key rotation).
                // v2.1 (2h ago) is still in the deployment list — it's the retry storm root cause.
                // Latency is slightly elevated (65ms vs 42ms baseline) — the password reset
                // JWT cache mismatch adds a small but measurable validation overhead.
                // Status stays HEALTHY — this is a subtle operational regression, not a cascade.
                "auth", "Auth Service", "AUTH", "v2.4", "healthy", 99.97, "#38bdf8",
                "1h ago", "alice",
                new ServiceMetrics(
                    new MetricValue(65,   42,   "ms",    "up"),
                    new MetricValue(0.12, 0.10, "%",     "up"),
                    new MetricValue(12,   10,   "/min",  "up"),
                    new MetricValue(1240, 1200, "req/s", "stable")
                )
            ),

            new ServiceInfo(
                "payment", "Payment Service", "PAY", "v1.8", "healthy", 99.95, "#a855f7",
                "6h ago", "bob",
                new ServiceMetrics(
                    new MetricValue(120,  115,  "ms",    "up"),
                    new MetricValue(0.18, 0.15, "%",     "up"),
                    new MetricValue(8,    7,    "/min",  "stable"),
                    new MetricValue(340,  350,  "req/s", "down")
                )
            ),

            new ServiceInfo(
                "order", "Order Service", "ORD", "v3.2", "healthy", 99.99, "#22c55e",
                "1d ago", "charlie",
                new ServiceMetrics(
                    new MetricValue(95,   92,   "ms",    "stable"),
                    new MetricValue(0.08, 0.08, "%",     "stable"),
                    new MetricValue(4,    4,    "/min",  "stable"),
                    new MetricValue(890,  880,  "req/s", "up")
                )
            ),

            new ServiceInfo(
                "inventory", "Inventory Service", "INV", "v2.0", "healthy", 100.0, "#f59e0b",
                "3d ago", "dave",
                new ServiceMetrics(
                    new MetricValue(67,   65,   "ms",    "stable"),
                    new MetricValue(0.04, 0.05, "%",     "down"),
                    new MetricValue(2,    3,    "/min",  "down"),
                    new MetricValue(450,  440,  "req/s", "up")
                )
            ),

            new ServiceInfo(
                "notification", "Notification Service", "NOTIF", "v1.5", "healthy", 99.92, "#f43f5e",
                "5d ago", "eve",
                new ServiceMetrics(
                    new MetricValue(34,   35,   "ms",    "down"),
                    new MetricValue(0.06, 0.07, "%",     "down"),
                    new MetricValue(1,    2,    "/min",  "down"),
                    new MetricValue(2100, 2050, "req/s", "up")
                )
            )
        );
    }

    private List<Dependency> buildDependencies() {
        return List.of(
            new Dependency("auth-payment",       "auth",         "payment", "JWT validate"),
            new Dependency("payment-order",      "payment",      "order",   "process order"),
            new Dependency("inventory-order",    "inventory",    "order",   "stock check"),
            new Dependency("notification-order", "notification", "order",   "event notify")
        );
    }

    private List<Deployment> buildDeployments() {
        return List.of(
            // Most recent — password reset JWT signing key rotation
            new Deployment(
                5, "auth", "Auth Service", "v2.4", "v2.3",
                "1h ago", "alice", "f7e8d9a",
                "Refactor JWT signing key rotation for auth token refresh flow",
                "refactor"
            ),
            // Retry storm root cause deployment — still in history
            new Deployment(
                1, "auth", "Auth Service", "v2.1", "v2.0",
                "2h ago", "alice", "a1b2c3d",
                "Add exponential backoff retry policy for downstream calls",
                "feature"
            ),
            new Deployment(
                2, "payment", "Payment Service", "v1.8", "v1.7",
                "6h ago", "bob", "e4f5g6h",
                "Optimize payment processing latency under load",
                "improvement"
            ),
            new Deployment(
                3, "order", "Order Service", "v3.2", "v3.1",
                "1d ago", "charlie", "i7j8k9l",
                "Add order validation middleware",
                "feature"
            ),
            new Deployment(
                4, "inventory", "Inventory Service", "v2.0", "v1.9",
                "3d ago", "dave", "m1n2o3p",
                "Migrate to async stock check model",
                "refactor"
            )
        );
    }

    private List<Commit> buildCommits() {
        return List.of(

            // Auth — most recent commits
            new Commit(
                "f7e8d9a", "auth", "Auth Service", "alice", "1h ago",
                "Refactor JWT signing key rotation for auth token refresh flow",
                "f7e8d9a1b2c3d4e5", "main", "refactor"
            ),
            new Commit(
                "a1b2c3d", "auth", "Auth Service", "alice", "2h ago",
                "Add exponential backoff retry policy for downstream calls",
                "a1b2c3d4e5f6a7b8", "main", "feature"
            ),
            new Commit(
                "a0b9c8d", "auth", "Auth Service", "alice", "4h ago",
                "Increase retry max-attempts from 3 to 5 for resilience",
                "a0b9c8d7e6f5a4b3", "main", "config"
            ),
            new Commit(
                "a9b8c7d", "auth", "Auth Service", "alice", "8h ago",
                "Tune connection pool size for downstream HTTP clients",
                "a9b8c7d6e5f4a3b2", "main", "config"
            ),

            // Payment
            new Commit(
                "e4f5g6h", "payment", "Payment Service", "bob", "6h ago",
                "Optimize payment processing latency under load",
                "e4f5g6h7i8j9k0l1", "main", "improvement"
            ),
            new Commit(
                "e3f2g1h", "payment", "Payment Service", "bob", "12h ago",
                "Add circuit breaker for auth-service dependency",
                "e3f2g1h0i9j8k7l6", "main", "feature"
            ),
            new Commit(
                "e2f1g0h", "payment", "Payment Service", "bob", "1d ago",
                "Fix timeout handling on auth token validation",
                "e2f1g0h9i8j7k6l5", "main", "fix"
            ),

            // Order
            new Commit(
                "i7j8k9l", "order", "Order Service", "charlie", "1d ago",
                "Add order validation middleware",
                "i7j8k9l0m1n2o3p4", "main", "feature"
            ),
            new Commit(
                "i6j5k4l", "order", "Order Service", "charlie", "2d ago",
                "Increase order queue concurrency limit",
                "i6j5k4l3m2n1o0p9", "main", "config"
            ),

            // Inventory
            new Commit(
                "m1n2o3p", "inventory", "Inventory Service", "dave", "3d ago",
                "Migrate to async stock check model",
                "m1n2o3p4q5r6s7t8", "main", "refactor"
            ),
            new Commit(
                "m0n9o8p", "inventory", "Inventory Service", "dave", "4d ago",
                "Remove synchronous stock lock on high-concurrency paths",
                "m0n9o8p7q6r5s4t3", "main", "improvement"
            ),

            // Notification
            new Commit(
                "q5r6s7t", "notification", "Notification Service", "eve", "5d ago",
                "Switch to event-driven order notification model",
                "q5r6s7t8u9v0w1x2", "main", "refactor"
            ),
            new Commit(
                "q4r3s2t", "notification", "Notification Service", "eve", "6d ago",
                "Add dead-letter queue for failed notification events",
                "q4r3s2t1u0v9w8x7", "main", "feature"
            )
        );
    }

    private SystemStatus buildSystemStatus() {
        return new SystemStatus(
            "healthy",  // status
            0,          // activeIncidents
            5,          // servicesHealthy
            5,          // servicesTotal
            120.0,      // p99Latency (ms)
            0.09,       // errorRate (%)
            5020.0      // totalThroughput (req/s)
        );
    }
}
