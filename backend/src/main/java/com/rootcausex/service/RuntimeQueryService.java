package com.rootcausex.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rootcausex.model.RuntimeQueryResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Contextual Runtime Querying — handles free-form operational questions.
 *
 * Receives a user query + optional investigation context, gathers the full
 * runtime state via InvestigationContextService, and either:
 *   (a) CLAUDE mode — calls Claude API with a runtime-query prompt
 *   (b) MOCK mode   — returns a pattern-matched operational answer
 *
 * Unlike InvestigationService (which is anomaly-triggered and returns a
 * structured RCA), RuntimeQueryService answers any operational question
 * about the current runtime state — deployments, topology, metrics,
 * anomalies, incident history, or "what changed recently".
 */
@Service
public class RuntimeQueryService {

    @Value("${anthropic.api.key:}")
    private String apiKey;

    @Value("${anthropic.model:claude-sonnet-4-6}")
    private String model;

    private static final String    ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    private static final ObjectMapper MAPPER      = new ObjectMapper();

    private final InvestigationContextService contextService;
    private final InvestigationPromptBuilder  promptBuilder;
    private final IncidentStateManager        incidentState;
    private final RestTemplate                restTemplate;

    public RuntimeQueryService(
        InvestigationContextService contextService,
        InvestigationPromptBuilder  promptBuilder,
        IncidentStateManager        incidentState
    ) {
        this.contextService = contextService;
        this.promptBuilder  = promptBuilder;
        this.incidentState  = incidentState;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(60_000);
        this.restTemplate = new RestTemplate(factory);
    }

    // ── Public entry point ────────────────────────────────────────────────────

    public RuntimeQueryResponse query(String userQuery, String investigationContext) {
        // Always build full context — Claude never answers cold
        String contextNarrative = contextService.buildContextNarrative(null, null);

        if (isClaudeEnabled()) {
            return callClaudeAndParse(contextNarrative, userQuery, investigationContext);
        }
        return buildMockResponse(userQuery, investigationContext);
    }

    // ── Claude mode ───────────────────────────────────────────────────────────

    private boolean isClaudeEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    private RuntimeQueryResponse callClaudeAndParse(
        String contextNarrative, String query, String investigationContext
    ) {
        try {
            String systemPrompt = promptBuilder.buildRuntimeQuerySystemPrompt();
            String userPrompt   = promptBuilder.buildRuntimeQueryUserPrompt(
                contextNarrative, query, investigationContext
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key",        apiKey);
            headers.set("anthropic-version", "2023-06-01");

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model",      model);
            body.put("max_tokens", 1024);
            body.put("system",     systemPrompt);
            body.put("messages",   List.of(Map.of("role", "user", "content", userPrompt)));

            ResponseEntity<String> resp = restTemplate.postForEntity(
                ANTHROPIC_URL, new HttpEntity<>(body, headers), String.class
            );

            JsonNode root = MAPPER.readTree(resp.getBody());
            String   text = root.path("content").get(0).path("text").asText();
            text = text.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();

            return parseResponse(text);
        } catch (Exception e) {
            // Fall back to mock on any API failure
            return buildMockResponse(query, investigationContext);
        }
    }

    private RuntimeQueryResponse parseResponse(String json) {
        try {
            JsonNode r = MAPPER.readTree(json);
            return new RuntimeQueryResponse(
                r.path("summary").asText("No summary available."),
                toList(r.path("evidence")),
                toList(r.path("services")),
                toList(r.path("relatedDeployments")),
                r.path("confidence").asDouble(0.75)
            );
        } catch (Exception e) {
            return new RuntimeQueryResponse(
                "Unable to parse runtime analysis. Check backend logs.",
                List.of(), List.of(), List.of(), 0.0
            );
        }
    }

    private List<String> toList(JsonNode node) {
        List<String> result = new ArrayList<>();
        if (node != null && node.isArray()) node.forEach(n -> result.add(n.asText()));
        return result;
    }

    // ── Mock mode — pattern-matched operational responses ─────────────────────
    // Each mock is phase-aware: responds differently based on incident state.
    // All facts reference actual values from MockDataRepository.

    private RuntimeQueryResponse buildMockResponse(String query, String investigationContext) {
        String  lower = (query == null ? "" : query).toLowerCase();
        int     phase = incidentState.currentPhase();
        boolean live  = incidentState.isActive();

        // Password reset / login failure — check FIRST (most specific patterns)
        if (matches(lower, "password reset", "reset login", "reset fail", "after reset")) {
            return mockPasswordReset();
        }
        if (matches(lower, "login fail", "login error", "authentication fail", "login increas",
                          "why are login", "login issue")) {
            return mockLoginFailure();
        }
        if (matches(lower, "jwt", "signing key", "token mismatch", "token fail", "token reject",
                          "validator cache", "key rotation")) {
            return mockJwtSigningKey();
        }

        // Deployment / what changed
        if (matches(lower, "changed", "recent", "deployed", "deployment", "what's new")) {
            return mockDeployments(phase, live);
        }
        // Auth instability
        if (lower.contains("auth") && matches(lower, "why", "unstable", "fail", "slow", "issue", "problem")) {
            return mockAuthUnstable(phase, live);
        }
        // Which deployment caused this
        if (matches(lower, "caused", "triggered", "which deployment", "correlat")) {
            return mockDeploymentCause(phase, live);
        }
        // Propagation / which service first
        if (matches(lower, "propagat", "spread", "first", "cascade", "order of failure")) {
            return mockPropagation(phase, live);
        }
        // Historical / has this happened before
        if (matches(lower, "before", "happened before", "precedent", "history", "similar")) {
            return mockHistorical();
        }
        // Topology / dependencies
        if (matches(lower, "depend", "topology", "upstream", "downstream", "calls")) {
            return mockTopology(lower);
        }
        // Retry specific
        if (matches(lower, "retry", "retries", "amplif")) {
            return mockRetry(phase, live);
        }
        // Payment specific
        if (lower.contains("payment") && matches(lower, "why", "slow", "fail", "issue")) {
            return mockPayment(phase, live);
        }
        // Generic runtime status
        return mockRuntimeStatus(phase, live);
    }

    private static boolean matches(String text, String... patterns) {
        for (String p : patterns) if (text.contains(p)) return true;
        return false;
    }

    // ── Mock response builders ────────────────────────────────────────────────

    // Password reset / login failure scenario responses ───────────────────────

    private RuntimeQueryResponse mockPasswordReset() {
        return new RuntimeQueryResponse(
            "auth-service v2.4 deployed 1h ago (commit f7e8d9a, alice) refactored JWT signing key"
            + " rotation for the token refresh flow. Password reset flows now generate tokens using"
            + " the updated signing format — however, downstream auth-validator instances still hold"
            + " stale signing keys cached before the v2.4 deployment. Valid post-reset tokens are"
            + " being rejected by validators referencing the old key. Login failure rate has climbed"
            + " from 0.3% to 9% specifically on the post-password-reset authentication path.",
            List.of(
                "auth-service v2.4 deployed 5:45 PM — commit f7e8d9a: 'Refactor JWT signing key rotation for auth token refresh flow'",
                "Post-reset login failure rate: 0.3% → 9% since 5:52 PM (+2900%)",
                "847 post-reset tokens rejected in 30 minutes — JWT signature validation mismatch",
                "Validator cache miss: stale signing key references detected on auth-validator instances",
                "auth latency elevated: 42ms → 65ms — validation overhead from key lookup failures"
            ),
            List.of("auth"),
            List.of(
                "auth-service v2.4 (1h ago, alice, f7e8d9a) [HIGH SIGNAL — JWT signing key rotation correlates with post-reset auth failure onset at 5:52 PM]",
                "auth-service v2.1 (2h ago, alice, a1b2c3d) [UNRELATED — retry policy change, no JWT impact]"
            ),
            0.89
        );
    }

    private RuntimeQueryResponse mockLoginFailure() {
        return new RuntimeQueryResponse(
            "Login failure rate elevated 9% on post-password-reset paths since 5:52 PM."
            + " Root signal: auth-service v2.4 (commit f7e8d9a, 1h ago) changed JWT signing key"
            + " rotation logic. Tokens generated by the new signing flow are being rejected by"
            + " validator instances still caching pre-v2.4 keys. Users who have NOT reset their"
            + " password are unaffected — this is specific to the reset token generation path."
            + " No downstream cascade detected. Payment and order services are healthy.",
            List.of(
                "Login failure rate: 0.3% → 9% at 5:52 PM — 7 minutes after v2.4 deployment",
                "auth-service v2.4 deployed 5:45 PM — commit f7e8d9a references 'signing key rotation'",
                "Failure pattern is specific to post-reset logins — non-reset sessions unaffected",
                "auth latency: 42ms → 65ms — consistent with key validation overhead",
                "payment, order, inventory, notification: all HEALTHY — no cascade propagation"
            ),
            List.of("auth"),
            List.of(
                "auth-service v2.4 (1h ago, alice, f7e8d9a) [HIGH SIGNAL — 7 min gap to first login failures]"
            ),
            0.91
        );
    }

    private RuntimeQueryResponse mockJwtSigningKey() {
        return new RuntimeQueryResponse(
            "auth-service v2.4 (commit f7e8d9a) modified the JWT signing key rotation mechanism"
            + " for the token refresh flow. The change affects how signing keys are selected during"
            + " password reset token generation — new tokens use the rotated key. Auth-validator"
            + " instances have not yet invalidated their cached signing key references, causing"
            + " mismatch on validation. This is a cache coherence issue: the signing key rotation"
            + " completed in the issuer but has not propagated to all validator cache layers.",
            List.of(
                "commit f7e8d9a: 'Refactor JWT signing key rotation for auth token refresh flow'",
                "Token issuance: using new signing key (post-rotation) since 5:45 PM deployment",
                "Token validation: auth-validator instances caching pre-rotation key — cache TTL not yet expired",
                "Affected path: password reset → new token issued → validation fails on cached old key",
                "Non-reset sessions: using tokens issued before rotation — no mismatch, no impact"
            ),
            List.of("auth"),
            List.of(
                "auth-service v2.4 (1h ago, alice, f7e8d9a) [ROOT — JWT signing key rotation without validator cache invalidation]"
            ),
            0.87
        );
    }

    private RuntimeQueryResponse mockDeployments(int phase, boolean live) {
        String incidentNote = live
            ? " auth-service v2.1 is actively correlating with the current P" + phase + " incident."
            : " auth-service v2.4 (1h ago) is correlating with elevated post-reset login failures.";

        return new RuntimeQueryResponse(
            "4 deployments in the past 24h." + incidentNote
            + " Most recent: auth-service v2.4 (alice, commit f7e8d9a, 1h ago) refactored JWT"
            + " signing key rotation — correlates with 9% post-reset login failure rate."
            + " auth-service v2.1 (alice, commit a1b2c3d, 2h ago) added exponential backoff retry policy."
            + " payment-service v1.8 (bob, 6h ago) optimized latency. order-service v3.2 (charlie, 1d ago) — no anomaly correlation.",
            List.of(
                "auth-service v2.4 deployed 1h ago — commit f7e8d9a: 'Refactor JWT signing key rotation for auth token refresh flow'",
                "auth-service v2.1 deployed 2h ago — commit a1b2c3d: 'Add exponential backoff retry policy for downstream calls'",
                "payment-service v1.8 deployed 6h ago — commit e4f5g6h: 'Optimize payment processing latency'",
                "order-service v3.2 deployed 1d ago — no anomaly correlation"
            ),
            List.of("auth", "payment", "order"),
            live
                ? List.of("auth-service v2.4 [HIGH RISK — JWT signing key rotation, post-reset login failures]",
                          "auth-service v2.1 [HIGH RISK — retry amplification, correlates with active incident]",
                          "payment-service v1.8 [MEDIUM RISK — degraded under auth failure]",
                          "order-service v3.2 [UNRELATED]")
                : List.of("auth-service v2.4 [HIGH RISK — post-reset login failure rate 9%]",
                          "auth-service v2.1 [MONITOR — retry policy not yet triggered under current load]",
                          "payment-service v1.8 [LOW RISK]",
                          "order-service v3.2 [UNRELATED]"),
            live ? 0.95 : 0.93
        );
    }

    private RuntimeQueryResponse mockAuthUnstable(int phase, boolean live) {
        if (!live) {
            return new RuntimeQueryResponse(
                "auth-service is operating within baseline parameters. Latency: 42ms (baseline: 42ms),"
                + " error rate: 0.10%, retry rate: 10/min. Last deployment: auth-service v2.1 (2h ago, alice,"
                + " commit a1b2c3d) introduced an exponential backoff retry policy — not yet triggering anomalies"
                + " under current load conditions.",
                List.of(
                    "auth-service v2.1 deployed 2h ago — commit a1b2c3d: 'Add exponential backoff retry policy'",
                    "auth current latency: 42ms (within baseline)",
                    "auth current error rate: 0.10% (within baseline)",
                    "auth retry rate: 10/min (within baseline)"
                ),
                List.of("auth"),
                List.of("auth-service v2.1 [MONITOR — retry policy change not yet stressed]"),
                0.88
            );
        }

        String metrics = phase >= 2
            ? "error rate 12.8%, latency 420ms, retry rate 320/min"
            : "error rate 3.2%, latency 180ms, retry rate 85/min";
        String status  = phase >= 2 ? "CRITICAL" : "DEGRADED";

        return new RuntimeQueryResponse(
            "auth-service v2.1 (commit a1b2c3d, alice) introduced an exponential backoff retry policy"
            + " 2h ago. Under peak load at 6:08 PM, each failed auth request generates up to 5 retries,"
            + " amplifying load on an already-stressed service. auth is now " + status + " — " + metrics + "."
            + " Downstream payment and order services are cascading under auth dependency failures.",
            List.of(
                "auth-service v2.1 deployed 2h ago — commit a1b2c3d: 'Add exponential backoff retry policy'",
                "auth retry rate: 10/min → " + (phase >= 2 ? "320/min (+3100%)" : "85/min (+750%)") + " at 6:08 PM",
                "auth p99 latency: 42ms → " + (phase >= 2 ? "420ms (+900%)" : "180ms (+329%)"),
                "auth error rate: 0.10% → " + (phase >= 2 ? "12.8%" : "3.2%")
            ),
            phase >= 2 ? List.of("auth", "payment", "order") : List.of("auth", "payment"),
            List.of("auth-service v2.1 [HIGH SIGNAL — exponential backoff retry policy under peak load]"),
            0.91
        );
    }

    private RuntimeQueryResponse mockDeploymentCause(int phase, boolean live) {
        if (!live) {
            return new RuntimeQueryResponse(
                "No active incident. Most recent deployment with highest change risk:"
                + " auth-service v2.1 (2h ago, alice, commit a1b2c3d) added an exponential backoff retry"
                + " policy. This class of change (retry amplification under peak load) is worth monitoring"
                + " during the 6–7 PM peak traffic window.",
                List.of(
                    "auth-service v2.1 deployed 2h ago — commit a1b2c3d: 'Add exponential backoff retry policy'",
                    "No anomalies currently detected on auth or downstream services"
                ),
                List.of("auth"),
                List.of("auth-service v2.1 [MONITOR — retry policy under peak load conditions]"),
                0.82
            );
        }
        return new RuntimeQueryResponse(
            "auth-service v2.1 deployed 2h ago by alice (commit a1b2c3d). 8 minutes later,"
            + " auth retry rate spiked from 10/min to 85/min (+750%). The commit message explicitly"
            + " describes 'exponential backoff retry policy for downstream calls' — this matches the"
            + " RETRY_AMPLIFICATION anomaly pattern exactly. Timing correlation: 8 minutes from deployment"
            + " to first anomaly is high-signal evidence. Confidence: HIGH.",
            List.of(
                "auth-service v2.1 deployed at 6:00 PM — 8 min gap to first anomaly on auth at 6:08 PM",
                "commit a1b2c3d: 'Add exponential backoff retry policy for downstream calls' — matches anomaly type",
                "auth retry rate: 10/min → 85/min within 8 minutes of deployment",
                "No other deployments in the anomaly window — single deployment to isolate"
            ),
            List.of("auth", "payment", "order"),
            List.of("auth-service v2.1 [HIGH SIGNAL — 8 min gap, commit message matches anomaly]",
                    "payment-service v1.8 [MEDIUM SIGNAL — under stress but not root cause]",
                    "order-service v3.2 [UNRELATED]"),
            0.93
        );
    }

    private RuntimeQueryResponse mockPropagation(int phase, boolean live) {
        if (!live || phase < 2) {
            return new RuntimeQueryResponse(
                "Dependency topology: auth → payment → order (primary cascade chain)."
                + " inventory → order and notification → order are secondary paths."
                + " auth is the highest-risk root in the dependency graph — all downstream"
                + " services depend on it for JWT validation.",
                List.of(
                    "auth → payment (JWT validate) — payment calls auth on every request",
                    "payment → order (process order) — order depends on payment clearance",
                    "inventory → order (stock check)",
                    "notification → order (send confirmation)"
                ),
                List.of("auth", "payment", "order", "inventory", "notification"),
                List.of(),
                0.99
            );
        }

        String chain = phase >= 3
            ? "auth (6:08 PM) → payment (6:15 PM, +7 min) → order (6:20 PM, +12 min)"
            : "auth (6:08 PM) → payment (6:15 PM, +7 min)";

        return new RuntimeQueryResponse(
            "Cascade sequence: " + chain + ". auth degraded first at 6:08 PM (8 min after v2.1 deployment)."
            + " payment failed next at 6:15 PM — every JWT validation call to auth began timing out."
            + (phase >= 3
               ? " order cascaded at 6:20 PM — it depends on both auth and payment, both were CRITICAL."
               : " order is not yet affected at the current phase.")
            + " Each hop follows the dependency edge exactly.",
            List.of(
                "auth DEGRADED at 6:12 PM, CRITICAL at 6:17 PM — retry rate spiked at 6:08 PM",
                "payment latency drift detected at 6:15 PM — auth dependency failure rate: 34%",
                phase >= 3
                    ? "order received degraded upstream responses from 2 dependencies simultaneously at 6:20 PM"
                    : "order remains healthy — upstream dependencies not fully critical yet"
            ),
            phase >= 3 ? List.of("auth", "payment", "order") : List.of("auth", "payment"),
            List.of("auth-service v2.1 [ROOT — propagation origin]"),
            0.94
        );
    }

    private RuntimeQueryResponse mockHistorical() {
        return new RuntimeQueryResponse(
            "No historical precedent for this exact incident pattern in the deployment history."
            + " This is the first deployment of an exponential backoff retry policy on auth-service."
            + " The retry amplification pattern (high retry rate → downstream cascade) is a known"
            + " class of failure but has not occurred in this system before. The commit a1b2c3d"
            + " is a net-new change with no prior version to roll back to that includes this behavior.",
            List.of(
                "auth-service v2.1 is the first deployment to introduce exponential backoff retry",
                "Previous version auth-service v2.0 used a fixed retry policy — no amplification",
                "No RETRY_AMPLIFICATION anomalies on record prior to this deployment",
                "System has not exceeded 15/min retry rate on auth before this incident"
            ),
            List.of("auth"),
            List.of("auth-service v2.1 [FIRST OCCURRENCE — no historical precedent]"),
            0.87
        );
    }

    private RuntimeQueryResponse mockTopology(String lower) {
        String focus = lower.contains("auth") ? "auth"
            : lower.contains("payment") ? "payment"
            : lower.contains("order")   ? "order"
            : null;

        if ("auth".equals(focus)) {
            return new RuntimeQueryResponse(
                "auth-service has 2 downstream dependents: payment-service and order-service (indirect)."
                + " payment calls auth on every request for JWT validation. order depends on payment which"
                + " depends on auth — making auth the highest-impact service in the topology."
                + " auth failure propagates to 3 of 5 services.",
                List.of("auth → payment (JWT validate) — every payment request calls auth",
                        "payment → order (process order) — order blocked by payment which blocks on auth",
                        "auth failure blast radius: payment + order (40% of total services)"),
                List.of("auth", "payment", "order"),
                List.of(),
                0.99
            );
        }

        return new RuntimeQueryResponse(
            "5-service topology with 4 dependency edges. Primary cascade chain: auth → payment → order."
            + " Secondary paths: inventory → order and notification → order."
            + " auth is the single highest-risk node — a failure propagates through the primary chain"
            + " to 3 downstream services. inventory and notification only affect order.",
            List.of(
                "auth → payment (JWT validate) — payment calls auth on every request",
                "payment → order (process order) — order depends on payment clearance",
                "inventory → order (stock check) — independent of auth cascade",
                "notification → order (send confirmation) — independent of auth cascade"
            ),
            List.of("auth", "payment", "order", "inventory", "notification"),
            List.of(),
            0.99
        );
    }

    private RuntimeQueryResponse mockRetry(int phase, boolean live) {
        if (!live) {
            return new RuntimeQueryResponse(
                "auth-service retry rate is at baseline: 10/min. No retry amplification detected."
                + " auth-service v2.1 (commit a1b2c3d) introduced an exponential backoff retry policy"
                + " — this carries amplification risk under peak load (6–7 PM) but has not triggered yet.",
                List.of("auth current retry rate: 10/min (baseline: 10/min — within normal range)",
                        "auth-service v2.1 max-attempts=5 with exponential backoff — amplification potential under load"),
                List.of("auth"),
                List.of("auth-service v2.1 [MONITOR — retry policy not yet stressed]"),
                0.85
            );
        }

        int retryRate   = phase >= 2 ? 320 : 85;
        int pctIncrease = phase >= 2 ? 3100 : 750;

        return new RuntimeQueryResponse(
            "auth retry rate has amplified " + pctIncrease + "% above baseline: 10/min → " + retryRate + "/min."
            + " Root cause: commit a1b2c3d in auth-service v2.1 introduced exponential backoff with"
            + " max-attempts=5. Under peak load, each failed request generates up to 5 retries —"
            + " a single failure produces 5× the normal request volume."
            + " payment-service is now also retrying against auth at 280/min, further amplifying load.",
            List.of(
                "auth retry rate: 10/min → " + retryRate + "/min at 6:08 PM (+"+pctIncrease+"%)",
                "commit a1b2c3d: exponential backoff with max-attempts=5",
                "payment retry rate against auth: 8/min → 280/min (compounding amplification)",
                "auth error rate climbed in step with retry rate — feedback loop confirmed"
            ),
            List.of("auth", "payment"),
            List.of("auth-service v2.1 [ROOT — exponential backoff retry policy introduced]"),
            0.93
        );
    }

    private RuntimeQueryResponse mockPayment(int phase, boolean live) {
        if (!live || phase < 2) {
            return new RuntimeQueryResponse(
                "payment-service is operating within degraded-but-functional parameters."
                + " Latency is elevated (980ms, baseline: 90ms) due to auth dependency timeouts."
                + " payment calls auth for every JWT validation — auth's current " + (live ? "DEGRADED" : "healthy")
                + " state is reflected directly in payment's response times.",
                List.of("payment latency: 90ms → 980ms — directly tracking auth timeout duration",
                        "payment depends on auth for JWT validation on every request",
                        "payment auth-dependency failure rate: 34% at 6:15 PM"),
                List.of("payment", "auth"),
                List.of("auth-service v2.1 [ROOT — auth failure propagates to payment]"),
                live ? 0.88 : 0.82
            );
        }

        return new RuntimeQueryResponse(
            "payment-service is CRITICAL — latency 1800ms, error rate 24.6%, throughput collapsed"
            + " from 350 req/s to 45 req/s (-87%). Root cause: auth-service failure."
            + " payment calls auth for JWT validation on every request — with auth error rate at 12.8%,"
            + " payment's own retry rate against auth spiked to 280/min, compounding the load."
            + " order-service is receiving CRITICAL responses from payment and has cascaded.",
            List.of(
                "payment p99 latency: 90ms → 1800ms at 6:22 PM",
                "payment error rate: 0.05% → 24.6% at 6:22 PM",
                "payment throughput: 350 req/s → 45 req/s (-87%)",
                "payment retry rate against auth: 8/min → 280/min (compounding auth load)"
            ),
            List.of("payment", "auth", "order"),
            List.of("auth-service v2.1 [ROOT — payment failure is downstream of auth]"),
            0.92
        );
    }

    private RuntimeQueryResponse mockRuntimeStatus(int phase, boolean live) {
        if (!live) {
            return new RuntimeQueryResponse(
                "All 5 services healthy. System latency: 52ms p99, error rate: 0.08%, throughput: 5200 req/s."
                + " 3 deployments in the past 24h — auth-service v2.1 (2h ago) carries highest change risk"
                + " with a new retry policy (commit a1b2c3d). No anomalies detected.",
                List.of(
                    "auth: HEALTHY — latency 42ms, error 0.10%, retry 10/min",
                    "payment: HEALTHY — latency 90ms, error 0.05%, throughput 350 req/s",
                    "order: HEALTHY — latency 65ms, error 0.12%",
                    "inventory: HEALTHY — latency 38ms",
                    "notification: HEALTHY — latency 25ms"
                ),
                List.of("auth", "payment", "order", "inventory", "notification"),
                List.of("auth-service v2.1 [MONITOR — retry policy not yet triggered]"),
                0.95
            );
        }

        String summary = switch (phase) {
            case 1 -> "P1 incident active — Phase 1. auth-service DEGRADED (retry amplification). "
                    + "4 of 5 services healthy. auth latency: 180ms (+329%), retry rate: 85/min (+750%).";
            case 2 -> "P1 incident active — Phase 2. auth CRITICAL, payment DEGRADED. "
                    + "auth latency: 420ms, error rate: 12.8%. payment latency: 980ms, throughput dropping.";
            case 3 -> "P0 incident active — Phase 3. auth CRITICAL, payment CRITICAL, order DEGRADED. "
                    + "Full cascade in progress. Checkout flow degraded, order placement failing.";
            default -> "P0 incident — Phase 4. Full cascade: auth, payment, order all CRITICAL. "
                     + "Checkout success rate ~0%. Immediate rollback of auth-service v2.1 recommended.";
        };

        return new RuntimeQueryResponse(
            summary,
            List.of(
                "auth-service v2.1 — root cause — commit a1b2c3d retry policy amplification",
                "Incident started 6:08 PM, " + (phase * 7) + " minutes elapsed",
                "Propagation chain: auth → payment → order (dependency order)"
            ),
            phase >= 3 ? List.of("auth", "payment", "order")
                : phase == 2 ? List.of("auth", "payment")
                : List.of("auth"),
            List.of("auth-service v2.1 [HIGH SIGNAL — root cause deployment]"),
            0.91
        );
    }
}
