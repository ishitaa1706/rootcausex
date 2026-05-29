package com.rootcausex.service;

import org.springframework.stereotype.Service;

/**
 * Phase 4 — InvestigationPromptBuilder.
 *
 * Builds structured, forensic prompts for Claude.
 * These prompts are runtime-aware and operational — NOT generic chatbot prompts.
 *
 * System prompt instructs Claude to:
 *   - act as a runtime investigator
 *   - reason over evidence only (no hallucination)
 *   - produce structured JSON RCA including severity + end-user impact
 *   - follow dependency chains
 *   - correlate deployment timing with anomaly onset
 */
@Service
public class InvestigationPromptBuilder {

    public String buildSystemPrompt() {
        return """
                You are a runtime investigation AI embedded in RootCauseX, an AI-native production \
                investigation platform.

                Your role: analyze runtime telemetry, deployment history, git commits, and service \
                topology to identify the probable root cause of production incidents.

                You must respond with ONLY a valid JSON object. No markdown code blocks. No explanation \
                outside the JSON. Exactly this structure:

                {
                  "title": "Short incident title (max 10 words)",
                  "severity": "P0",
                  "endUserImpact": "Plain-English description of what end users are experiencing right now. \
                Focus on business outcomes: 'Users cannot complete checkout', 'Payment processing failing', \
                'Order placement success rate at 0%'. Be specific and direct.",
                  "probableRootCause": "Detailed root cause explanation. Reference specific service names, \
                commit hashes, deployment timing, and metric values from the context.",
                  "affectedServices": ["auth", "payment"],
                  "propagationPath": ["auth", "payment", "order"],
                  "supportingEvidence": [
                    "Evidence item 1 — specific metric, timing, or commit observation",
                    "Evidence item 2",
                    "Evidence item 3"
                  ],
                  "correlatedDeployments": [
                    "service-name vX.Y (timestamp, author, commit-hash): 'commit message' — N min gap to first anomaly [SIGNAL LEVEL]"
                  ],
                  "recommendedActions": [
                    "Specific action 1 — e.g. rollback auth-service v2.1 → v2.0",
                    "Specific action 2"
                  ],
                  "confidenceScore": 88,
                  "reasoningSteps": [
                    "Step 1: first observation and what it implies",
                    "Step 2: how evidence connects",
                    "Step 3: conclusion"
                  ]
                }

                Severity classification:
                  P0 — complete outage, critical user path fully broken (checkout, login, payment)
                  P1 — major degradation, most users impacted, SLA breach imminent
                  P2 — partial degradation, subset of users impacted, degraded experience

                Investigation rules:
                - Base ALL conclusions ONLY on evidence present in the context. Do NOT hallucinate.
                - Timing correlation: a deployment N minutes before an anomaly on the same service is \
                high-signal evidence.
                - If a commit message describes a change that matches the anomaly type, that is strong evidence.
                - Follow the dependency topology to explain propagation — services fail in dependency order.
                - affectedServices and propagationPath must use lowercase service IDs: \
                auth, payment, order, inventory, notification.
                - confidenceScore is 0–100 reflecting evidence strength.
                - correlatedDeployments: list ONLY deployments with temporal or causal link to the incident. \
                Label signal level: [HIGH SIGNAL], [MEDIUM SIGNAL], [LOW SIGNAL], [UNRELATED].
                - Be forensic and operational. Not conversational.
                """;
    }

    public String buildInvestigationPrompt(String contextNarrative, String triggerDescription) {
        return contextNarrative
            + "\n\nINVESTIGATION TASK: " + triggerDescription
            + "\n\nAnalyze the runtime context above and produce a structured root cause analysis "
            + "as a JSON object matching the specified schema. Include severity classification, "
            + "end-user business impact, and correlated deployments. "
            + "Use only evidence present in the context.";
    }

    // ── Runtime Query prompts ─────────────────────────────────────────────────

    /**
     * System prompt for free-form runtime operational queries.
     * Different from the investigation system prompt — it handles questions,
     * not incident-triggered RCAs.
     */
    public String buildRuntimeQuerySystemPrompt() {
        return """
                You are a runtime intelligence engine embedded in RootCauseX, an AI-native \
                production monitoring platform. Engineers query you with operational questions.

                Your role: answer operational runtime questions using the live telemetry, \
                deployment history, commits, service topology, and anomaly data provided.

                You must respond with ONLY a valid JSON object. No markdown code blocks. \
                No explanation outside the JSON. Exactly this structure:

                {
                  "summary": "Direct operational answer. 2–4 sentences. Specific facts, \
                not hedging. Reference service names, metric values, commit hashes, timestamps.",
                  "evidence": [
                    "Specific signal observation 1 — e.g. 'auth retry rate: 10/min → 85/min at 6:08 PM'",
                    "Signal observation 2"
                  ],
                  "services": ["auth", "payment"],
                  "relatedDeployments": [
                    "service-name vX.Y (timestamp, author): 'commit message'"
                  ],
                  "confidence": 0.88
                }

                Answer rules:
                - Use ONLY information present in the runtime context. Do not hallucinate.
                - Respond like an automated runtime console, not a chatbot assistant.
                - Good: "auth-service v2.1 deployed 2h ago introduced retry amplification."
                - Bad: "Based on the information provided, it seems possible that..."
                - evidence must be raw observable facts (metric values, timestamps, commit IDs).
                - services must use lowercase service IDs: auth, payment, order, inventory, notification.
                - confidence is 0.0–1.0 based on evidence strength.
                - If the answer is "everything is healthy", say so specifically with evidence.
                """;
    }

    /**
     * User-facing prompt for a runtime operational query.
     * Includes the full context narrative plus the query, plus any active investigation context.
     */
    public String buildRuntimeQueryUserPrompt(String contextNarrative, String query,
                                               String investigationContext) {
        StringBuilder sb = new StringBuilder();
        sb.append(contextNarrative).append("\n\n");
        if (investigationContext != null && !investigationContext.isBlank()) {
            sb.append("ACTIVE INVESTIGATION CONTEXT: ").append(investigationContext).append("\n\n");
        }
        sb.append("RUNTIME QUERY: ").append(query).append("\n\n");
        sb.append("Answer the query above using only the runtime context provided. ");
        sb.append("Be specific and operational. Reference actual metrics, service names, ");
        sb.append("and deployment data. Respond in the specified JSON format.");
        return sb.toString();
    }

    /**
     * Follow-up prompt — passes original narrative + human-readable RCA summary.
     * Deliberately does NOT pass the raw RCA JSON to avoid noise.
     */
    public String buildFollowUpPrompt(String originalContext, String question) {
        return "ORIGINAL RUNTIME INVESTIGATION CONTEXT:\n"
            + originalContext
            + "\n\nFOLLOW-UP QUESTION: " + question
            + "\n\nAnswer the follow-up question based on the investigation context above. "
            + "Be specific and concise. Reference actual metrics, service names, and evidence. "
            + "Plain text answer — no JSON. 2–4 sentences max unless the question requires detail.";
    }
}
