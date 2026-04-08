package com.smartcampus.controller;

import com.smartcampus.model.Resource;
import com.smartcampus.model.User;
import com.smartcampus.service.ResourceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    // GET /api/resources
    // Optional query params: ?type=VEHICLE&status=AVAILABLE
    @GetMapping
    public ResponseEntity<List<Resource>> getAllResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(
            resourceService.getAllResources(type, status)
        );
    }

    // GET /api/resources/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getResourceById(@PathVariable String id) {
        try {
            return ResponseEntity.ok(resourceService.getResourceById(id));
        } catch (Exception e) {
            return ResponseEntity.status(404)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/resources — Admin only
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> createResource(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        try {
            Resource created = resourceService.createResource(body, user.getId());
            return ResponseEntity.status(201).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    // PUT /api/resources/{id} — Admin only
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateResource(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(resourceService.updateResource(id, body));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    // PATCH /api/resources/{id}/status — Admin only
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            if (status == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Status is required"));
            }
            return ResponseEntity.ok(resourceService.updateStatus(id, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/resources/{id} — Admin only
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteResource(@PathVariable String id) {
        try {
            resourceService.deleteResource(id);
            return ResponseEntity.ok(Map.of("message", "Resource deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
}