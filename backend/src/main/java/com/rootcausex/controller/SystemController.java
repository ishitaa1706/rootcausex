package com.rootcausex.controller;

import com.rootcausex.model.SystemStatus;
import com.rootcausex.service.RuntimeDataService;
import org.springframework.web.bind.annotation.*;

/**
 * GET /system/status — aggregated health summary for the entire runtime world.
 *
 * In Phase 2 this will reflect live incident state.
 */
@RestController
@RequestMapping("/system")
public class SystemController {

    private final RuntimeDataService runtimeDataService;

    public SystemController(RuntimeDataService runtimeDataService) {
        this.runtimeDataService = runtimeDataService;
    }

    @GetMapping("/status")
    public SystemStatus getSystemStatus() {
        return runtimeDataService.getSystemStatus();
    }
}
