package com.smartcampus.controller;

import com.smartcampus.model.User;
import com.smartcampus.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    // GET /api/analytics/dashboard — ADMIN only
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(@AuthenticationPrincipal User user) {
        if (user == null || user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Admin access required"));
        }
        return ResponseEntity.ok(analyticsService.getDashboardAnalytics());
    }
}
