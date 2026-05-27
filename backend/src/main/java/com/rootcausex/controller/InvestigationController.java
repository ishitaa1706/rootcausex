package com.rootcausex.controller;

import com.rootcausex.model.*;
import com.rootcausex.service.AIInvestigationService;
import com.rootcausex.service.InvestigationContextService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Phase 4 — Investigation endpoints.
 *
 * POST /investigate
 *   Receives an anomaly or timeline event ID.
 *   Aggregates full runtime context → calls Claude → returns structured RCA.
 *
 * POST /investigate/follow-up
 *   Receives investigationId + question.
 *   Continues the investigation from the original RCA context.
 */
@RestController
@RequestMapping("/investigate")
public class InvestigationController {

    private final InvestigationContextService contextService;
    private final AIInvestigationService      aiService;

    public InvestigationController(
        InvestigationContextService contextService,
        AIInvestigationService      aiService
    ) {
        this.contextService = contextService;
        this.aiService      = aiService;
    }

    @PostMapping
    public ResponseEntity<InvestigationResponse> investigate(
        @RequestBody InvestigationRequest request
    ) {
        String contextNarrative = contextService.buildContextNarrative(
            request.anomalyId(),
            request.timelineEventId()
        );

        String triggerDescription = request.anomalyId() != null
            ? "Investigate anomaly " + request.anomalyId() + " — determine the probable root cause."
            : "Investigate timeline event " + request.timelineEventId() + " — determine the probable root cause.";

        InvestigationResponse rca = aiService.investigate(contextNarrative, triggerDescription);
        return ResponseEntity.ok(rca);
    }

    @PostMapping("/follow-up")
    public ResponseEntity<FollowUpResponse> followUp(
        @RequestBody FollowUpRequest request
    ) {
        FollowUpResponse answer = aiService.followUp(
            request.investigationId(),
            request.question()
        );
        return ResponseEntity.ok(answer);
    }
}
