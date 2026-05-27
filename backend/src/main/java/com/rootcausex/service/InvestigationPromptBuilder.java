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
 *   - produce structured JSON RCA
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
                  "probableRootCause": "Detailed root cause explanation. Reference specific service names, \
                commit hashes, deployment timing, and metric values from the context.",
                  "affectedServices": ["auth", "payment"],
                  "propagationPath": ["auth", "payment", "order"],
                  "supportingEvidence": [
                    "Evidence item 1 — specific metric, timing, or commit observation",
                    "Evidence item 2",
                    "Evidence item 3"
                  ],
                  "recommendedActions": [
                    "Specific action 1",
                    "Specific action 2"
                  ],
                  "confidenceScore": 88,
                  "reasoningSteps": [
                    "Step 1: first observation",
                    "Step 2: what this implies",
                    "Step 3: how evidence connects"
                  ]
                }

                Investigation rules:
                - Base ALL conclusions ONLY on evidence present in the context. Do NOT hallucinate.
                - Timing correlation: a deployment N minutes before an anomaly on the same service is \
                high-signal evidence.
                - If a commit message describes a change that matches the anomaly type, that is strong evidence.
                - Follow the dependency topology to explain propagation — services fail in dependency order.
                - affectedServices and propagationPath must use lowercase service IDs: \
                auth, payment, order, inventory, notification.
                - confidenceScore is 0–100 reflecting evidence strength.
                - Be forensic and operational. Not conversational.
                """;
    }

    public String buildInvestigationPrompt(String contextNarrative, String triggerDescription) {
        return contextNarrative
            + "\n\nINVESTIGATION TASK: " + triggerDescription
            + "\n\nAnalyze the runtime context above and produce a structured root cause analysis "
            + "as a JSON object matching the specified schema. Use only evidence present in the context.";
    }

    public String buildFollowUpPrompt(String originalContext, String originalRca, String question) {
        return "ORIGINAL RUNTIME INVESTIGATION CONTEXT:\n"
            + originalContext
            + "\n\nORIGINAL ROOT CAUSE ANALYSIS:\n"
            + originalRca
            + "\n\nFOLLOW-UP QUESTION: " + question
            + "\n\nAnswer the follow-up question based on the investigation context and RCA above. "
            + "Be specific and concise. Reference actual metrics, service names, and evidence from the context. "
            + "Plain text answer — no JSON.";
    }
}
