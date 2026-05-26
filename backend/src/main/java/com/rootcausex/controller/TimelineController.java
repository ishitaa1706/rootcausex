package com.rootcausex.controller;

import com.rootcausex.model.PlaybackState;
import com.rootcausex.model.TimelineEvent;
import com.rootcausex.service.TimelineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * GET /timeline/events                    — full chronological incident story
 * GET /timeline/playback-state/{phase}    — dashboard snapshot for a given phase
 * GET /timeline/correlation/{deploymentId} — causal correlation for a deployment
 */
@RestController
@RequestMapping("/timeline")
public class TimelineController {

    private final TimelineService timelineService;

    public TimelineController(TimelineService timelineService) {
        this.timelineService = timelineService;
    }

    @GetMapping("/events")
    public List<TimelineEvent> getAllEvents() {
        return timelineService.getAllEvents();
    }

    @GetMapping("/playback-state/{phase}")
    public ResponseEntity<PlaybackState> getPlaybackState(@PathVariable int phase) {
        if (phase < 0 || phase > 4) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(timelineService.getPlaybackState(phase));
    }

    @GetMapping("/correlation/{deploymentId}")
    public ResponseEntity<Map<String, Object>> getCorrelation(@PathVariable int deploymentId) {
        return timelineService.getCorrelation(deploymentId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
}
