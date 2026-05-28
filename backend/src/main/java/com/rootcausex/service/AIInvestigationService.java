package com.rootcausex.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rootcausex.model.FollowUpResponse;
import com.rootcausex.model.InvestigationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Phase 4 — AIInvestigationService.
 *
 * Calls Claude API with a structured investigation context and returns a parsed RCA.
 * Stores investigation context in memory for follow-up conversations.
 *
 * MOCK mode (default): returns a realistic pre-built RCA derived from the canonical
 * incident scenario (auth-service v2.1 retry amplification cascade).
 * Activated when ANTHROPIC_API_KEY is not set — demo works without an API key.
 *
 * CLAUDE mode: activated when ANTHROPIC_API_KEY is set in environment.
 * Calls claude-sonnet-4-6 and parses the structured JSON response.
 *
 * Memory: investigation contexts are stored in a bounded LRU-style map (max 100 entries)
 * to prevent memory growth in long-running sessions.
 */
@Service
public class AIInvestigationService {

    @Value("${anthropic.api.key:}")
    private String apiKey;

    @Value("${anthropic.model:claude-sonnet-4-6}")
    private String model;

    private static final String   ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
    private static final ObjectMapper MAPPER    = new ObjectMapper();
    private static final int      MAX_STORED    = 100;   // bounded in-memory store

    // RestTemplate with explicit connect + read timeouts (prevents thread-pool hangs)
    private final RestTemplate               restTemplate;
    private final InvestigationPromptBuilder promptBuilder;

    // investigationId → contextNarrative — bounded store for follow-up conversations
    private final Map<String, String> investigations = new ConcurrentHashMap<>();

    public AIInvestigationService(InvestigationPromptBuilder promptBuilder) {
        this.promptBuilder = promptBuilder;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);  // 10 s connect
        factory.setReadTimeout(60_000);     // 60 s read (Claude can be slow on first token)
        this.restTemplate = new RestTemplate(factory);
    }

    // ── Investigation ─────────────────────────────────────────────────────────

    public InvestigationResponse investigate(String contextNarrative, String triggerDescription) {
        String id = shortId();

        // Evict oldest if at capacity (simple size cap — acceptable for demo)
        if (investigations.size() >= MAX_STORED) {
            investigations.keySet().stream().findFirst().ifPresent(investigations::remove);
        }
        investigations.put(id, contextNarrative);

        if (isClaudeEnabled()) {
            return callClaudeAndParse(id, contextNarrative, triggerDescription);
        } else {
            return buildMockResponse(id, contextNarrative);
        }
    }

    // ── Follow-up ────────────────────────────────────────────────────────────

    public FollowUpResponse followUp(String investigationId, String question) {
        String context = investigations.get(investigationId);
        if (context == null) {
            return new FollowUpResponse(
                "Investigation context has expired. Please start a new investigation to continue."
            );
        }

        if (isClaudeEnabled()) {
            String prompt = promptBuilder.buildFollowUpPrompt(context, question);
            String answer = callClaudeRaw(null, prompt);
            return new FollowUpResponse(answer);
        } else {
            return buildMockFollowUp(question);
        }
    }

    // ── Claude API ────────────────────────────────────────────────────────────

    private boolean isClaudeEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    private InvestigationResponse callClaudeAndParse(String id, String context, String trigger) {
        String systemPrompt = promptBuilder.buildSystemPrompt();
        String userPrompt   = promptBuilder.buildInvestigationPrompt(context, trigger);
        String rawJson      = callClaudeRaw(systemPrompt, userPrompt);
        return parseResponse(id, rawJson);
    }

    private String callClaudeRaw(String systemPrompt, String userPrompt) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key",        apiKey);
            headers.set("anthropic-version", "2023-06-01");

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model",      model);
            body.put("max_tokens", 2048);
            if (systemPrompt != null && !systemPrompt.isBlank()) {
                body.put("system", systemPrompt);
            }
            body.put("messages", List.of(Map.of("role", "user", "content", userPrompt)));

            ResponseEntity<String> resp = restTemplate.postForEntity(
                ANTHROPIC_URL, new HttpEntity<>(body, headers), String.class
            );

            JsonNode root = MAPPER.readTree(resp.getBody());
            String   text = root.path("content").get(0).path("text").asText();
            // Strip markdown code fence if Claude wraps the JSON
            return text.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();

        } catch (Exception e) {
            throw new RuntimeException("Claude API call failed: " + e.getMessage(), e);
        }
    }

    // ── Response parsing ──────────────────────────────────────────────────────

    private InvestigationResponse parseResponse(String id, String json) {
        try {
            JsonNode r = MAPPER.readTree(json);
            return new InvestigationResponse(
                id,
                r.path("title").asText("Incident Investigation"),
                r.path("severity").asText("P1"),
                r.path("endUserImpact").asText("Service degradation detected — user-facing impact being assessed."),
                r.path("probableRootCause").asText("Analysis unavailable — see supporting evidence."),
                toList(r.path("affectedServices")),
                toList(r.path("propagationPath")),
                toList(r.path("supportingEvidence")),
                toList(r.path("correlatedDeployments")),
                toList(r.path("recommendedActions")),
                r.path("confidenceScore").asInt(70),
                toList(r.path("reasoningSteps"))
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Claude response: " + e.getMessage(), e);
        }
    }

    private List<String> toList(JsonNode node) {
        List<String> result = new ArrayList<>();
        if (node != null && node.isArray()) {
            node.forEach(n -> result.add(n.asText()));
        }
        return result;
    }

    private String shortId() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 10);
    }

    // ── MOCK mode ─────────────────────────────────────────────────────────────
    // Returns a realistic RCA derived from the canonical incident story.
    // All facts reference actual values from MockDataRepository + DriftDetectionService.
    // No hallucination — every claim matches real mock data.

    private InvestigationResponse buildMockResponse(String id, String contextNarrative) {
        // Detect whether this is a cascade scenario (phase 3–4) or early drift (phase 1–2)
        boolean fullCascade   = contextNarrative.contains("order") && contextNarrative.contains("CRITICAL");
        boolean paymentDriven = contextNarrative.contains("payment") && !fullCascade;

        String severity     = fullCascade ? "P0" : (paymentDriven ? "P1" : "P1");
        String userImpact   = fullCascade
            ? "Users cannot complete purchases. Payment processing is failing — checkout success rate is effectively 0%. All orders placed in the last 28 minutes may have been lost or require retry."
            : "Users are experiencing slow payment processing. Checkout latency has spiked significantly. A subset of transactions are timing out and failing.";

        String rootCause = "auth-service v2.1 deployed 2h ago by alice (commit a1b2c3d) introduced an " +
            "exponential backoff retry policy for downstream calls. Under peak load at 6:08 PM, " +
            "auth began retrying at 85/min (baseline: 10/min, +750%). With max-attempts set to 5 and " +
            "exponential backoff, each failed request generates up to 5 retries — amplifying load on " +
            "an already-stressed auth service. By 6:17 PM auth reached CRITICAL state (error rate 12.8%, " +
            "latency 420ms). payment-service, which calls auth for every JWT validation, began timing out " +
            "at 6:15 PM and added its own retry load (280/min against auth). order-service, downstream of " +
            "both, received degraded responses from 2 upstream dependencies and cascaded to CRITICAL by 6:28 PM. " +
            "28 minutes from deployment to full cascade. Confidence: HIGH — commit message directly describes " +
            "the behaviour pattern and timing correlation is 8 minutes.";

        List<String> affected       = fullCascade
            ? List.of("auth", "payment", "order")
            : List.of("auth", "payment");
        List<String> propagation    = fullCascade
            ? List.of("auth", "payment", "order")
            : List.of("auth", "payment");

        List<String> evidence = new ArrayList<>(List.of(
            "auth-service v2.1 deployed at 6:00 PM by alice — 8 min gap to first anomaly on auth",
            "Commit a1b2c3d message: 'Add exponential backoff retry policy for downstream calls'",
            "auth retry rate: 10/min → 85/min (+750%) at 6:08 PM",
            "auth p99 latency: 42ms → 180ms (+329%) at 6:10 PM; escalated to 420ms (CRITICAL) at 6:17 PM",
            "auth error rate: 0.10% → 12.8% (+12,700%) by 6:17 PM",
            "payment auth-dependency call failures: 34% at 6:15 PM",
            "payment retry rate against auth: 8/min → 280/min at 6:22 PM"
        ));
        if (fullCascade) {
            evidence.add("payment throughput collapsed: 350 → 45 req/s (−87%) at 6:22 PM");
            evidence.add("order-service upstream health checks: 2/2 CRITICAL at 6:20 PM");
            evidence.add("order error rate: 0.12% → 18.2% at 6:28 PM");
        }

        List<String> deployments = List.of(
            "auth-service v2.1 (2h ago, alice, commit a1b2c3d): 'Add exponential backoff retry policy' — 8 min gap to first anomaly [HIGH SIGNAL]",
            "payment-service v1.8 (6h ago, bob, commit e4f5g6h): 'Optimize payment processing latency' — degraded under auth failure, likely amplified retry load [MEDIUM SIGNAL]",
            "order-service v3.2 (1d ago, charlie): 'Add order validation middleware' — no anomaly correlation [UNRELATED]"
        );

        List<String> actions = new ArrayList<>(List.of(
            "IMMEDIATE: Rollback auth-service v2.1 → v2.0 to stop retry amplification at source",
            "Verify auth retry rate returns to baseline (10/min) within 2 minutes of rollback",
            "Review commit a1b2c3d — reduce max-attempts from 5 → 3, add jitter to backoff intervals"
        ));
        if (fullCascade) {
            actions.add("After auth stabilises: check payment and order services auto-recover or restart them");
            actions.add("Add circuit breaker on payment → auth to prevent future cascades under auth degradation");
        }
        actions.add("Post-incident: load-test the retry policy under peak traffic before re-deploying");

        List<String> reasoning = List.of(
            "Step 1: RETRY_AMPLIFICATION anomaly on auth at 6:08 PM — 8 min after v2.1 deployment. Timing is high-signal.",
            "Step 2: Commit a1b2c3d explicitly introduces exponential backoff retry — directly explains the anomaly type.",
            "Step 3: Dependency graph: auth → payment → order. Each service degraded in exact dependency order with ~5–8 min lag.",
            "Step 4: payment retry rate against auth (280/min) confirms the amplification is propagating downstream.",
            "Step 5: 28-minute incident window from deployment to full cascade — consistent with progressive retry amplification.",
            "Step 6: Confidence HIGH — commit message, timing, anomaly type, and propagation path all converge on same cause."
        );

        return new InvestigationResponse(
            id,
            fullCascade ? "Auth Retry Cascade — Full Service Failure" : "Auth Retry Amplification — Payment Degradation",
            severity,
            userImpact,
            rootCause,
            affected,
            propagation,
            evidence,
            deployments,
            actions,
            fullCascade ? 91 : 84,
            reasoning
        );
    }

    private FollowUpResponse buildMockFollowUp(String question) {
        String lower = question.toLowerCase();

        if (lower.contains("rollback") || lower.contains("fix") || lower.contains("resolve")) {
            return new FollowUpResponse(
                "Rollback auth-service v2.1 → v2.0 immediately. This removes the exponential backoff policy " +
                "and stops the retry amplification at source. After rollback, monitor auth retry rate — " +
                "it should return to ~10/min within 2 minutes. Payment and order services should " +
                "auto-recover once auth stabilises. If they do not recover within 5 minutes, restart them."
            );
        }
        if (lower.contains("why") || lower.contains("cause") || lower.contains("root")) {
            return new FollowUpResponse(
                "The exponential backoff retry policy in commit a1b2c3d multiplies request load under failure. " +
                "With max-attempts=5 and exponential backoff, a single failed request can generate 5 retries. " +
                "Under peak traffic (6:00–7:00 PM), auth is already under load — each retry adds more load, " +
                "which causes more failures, which triggers more retries. This feedback loop amplified " +
                "auth's retry rate from 10/min to 85/min in 8 minutes."
            );
        }
        if (lower.contains("payment") || lower.contains("order")) {
            return new FollowUpResponse(
                "Payment service calls auth for every JWT validation. When auth error rate hit 34%, " +
                "payment's own retry policy kicked in — retrying auth at 280/min, which further amplified " +
                "auth's load. Order service depends on both auth and payment; receiving degraded responses " +
                "from 2 upstream dependencies simultaneously caused it to cascade to CRITICAL in 8 minutes."
            );
        }
        if (lower.contains("prevent") || lower.contains("circuit") || lower.contains("future")) {
            return new FollowUpResponse(
                "Three changes would prevent this class of incident: (1) Cap retry max-attempts at 3, add " +
                "jitter to break synchronous retry waves; (2) Add a circuit breaker on payment → auth so " +
                "payment fails fast instead of retrying under auth failure; (3) Load-test any retry policy " +
                "change under peak-traffic conditions before deploying to production."
            );
        }

        // Generic fallback
        return new FollowUpResponse(
            "Based on the investigation context: auth-service v2.1 (commit a1b2c3d) introduced an " +
            "exponential backoff retry policy that amplified load under peak traffic conditions, " +
            "cascading through the auth → payment → order dependency chain over 28 minutes. " +
            "The rollback path is auth-service v2.1 → v2.0."
        );
    }
}
