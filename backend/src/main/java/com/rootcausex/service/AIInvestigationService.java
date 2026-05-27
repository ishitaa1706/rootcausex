package com.rootcausex.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rootcausex.model.FollowUpResponse;
import com.rootcausex.model.InvestigationResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
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
 * If ANTHROPIC_API_KEY is not set, returns a realistic fallback response
 * so the demo still works without an API key.
 *
 * Model: claude-sonnet-4-6
 * API:   https://api.anthropic.com/v1/messages
 */
@Service
public class AIInvestigationService {

    @Value("${anthropic.api.key:}")
    private String apiKey;

    @Value("${anthropic.model:claude-sonnet-4-6}")
    private String model;

    private static final String ANTHROPIC_URL    = "https://api.anthropic.com/v1/messages";
    private static final ObjectMapper MAPPER     = new ObjectMapper();

    private final RestTemplate             restTemplate = new RestTemplate();
    private final InvestigationPromptBuilder promptBuilder;

    // investigationId → {context, rca} — stored for follow-up conversations
    private final Map<String, Map<String, String>> investigations = new ConcurrentHashMap<>();

    public AIInvestigationService(InvestigationPromptBuilder promptBuilder) {
        this.promptBuilder = promptBuilder;
    }

    // ── Investigation ─────────────────────────────────────────────────────────

    public InvestigationResponse investigate(String contextNarrative, String triggerDescription) {
        String id = UUID.randomUUID().toString().replace("-", "").substring(0, 10);

        String systemPrompt = promptBuilder.buildSystemPrompt();
        String userPrompt   = promptBuilder.buildInvestigationPrompt(contextNarrative, triggerDescription);

        String rawJson = callClaude(systemPrompt, userPrompt);

        // Persist for follow-up
        Map<String, String> stored = new HashMap<>();
        stored.put("context", contextNarrative);
        stored.put("rca",     rawJson);
        investigations.put(id, stored);

        return parseInvestigationResponse(id, rawJson);
    }

    // ── Follow-up ────────────────────────────────────────────────────────────

    public FollowUpResponse followUp(String investigationId, String question) {
        Map<String, String> stored = investigations.get(investigationId);
        if (stored == null) {
            return new FollowUpResponse(
                "Investigation context not found. Please start a new investigation first."
            );
        }

        String followUpPrompt = promptBuilder.buildFollowUpPrompt(
            stored.get("context"),
            stored.get("rca"),
            question
        );

        // Follow-up: no system prompt — full context is in the user message
        String answer = callClaude(null, followUpPrompt);
        return new FollowUpResponse(answer);
    }

    // ── Claude API call ───────────────────────────────────────────────────────

    private String callClaude(String systemPrompt, String userPrompt) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("ANTHROPIC_API_KEY is not configured. " +
                "Set the environment variable before starting the backend.");
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-api-key",          apiKey);
            headers.set("anthropic-version",   "2023-06-01");

            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model",      model);
            body.put("max_tokens", 2048);

            if (systemPrompt != null && !systemPrompt.isBlank()) {
                body.put("system", systemPrompt);
            }
            body.put("messages", List.of(Map.of("role", "user", "content", userPrompt)));

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(ANTHROPIC_URL, entity, String.class);

            JsonNode root = MAPPER.readTree(response.getBody());
            String text   = root.path("content").get(0).path("text").asText();

            // Strip markdown code blocks if Claude wraps the JSON
            return text.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();

        } catch (Exception e) {
            throw new RuntimeException("Claude API call failed: " + e.getMessage(), e);
        }
    }

    // ── Response parsing ──────────────────────────────────────────────────────

    private InvestigationResponse parseInvestigationResponse(String id, String json) {
        try {
            JsonNode root = MAPPER.readTree(json);
            return new InvestigationResponse(
                id,
                root.path("title").asText("Incident Investigation"),
                root.path("probableRootCause").asText("Analysis unavailable — see supporting evidence."),
                toList(root.path("affectedServices")),
                toList(root.path("propagationPath")),
                toList(root.path("supportingEvidence")),
                toList(root.path("recommendedActions")),
                root.path("confidenceScore").asInt(75),
                toList(root.path("reasoningSteps"))
            );
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Claude response as JSON: " + e.getMessage(), e);
        }
    }

    private List<String> toList(JsonNode node) {
        List<String> result = new ArrayList<>();
        if (node.isArray()) {
            node.forEach(n -> result.add(n.asText()));
        }
        return result;
    }

}
