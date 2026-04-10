package com.smartcampus.controller;

import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.service.TicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/tickets")
public class TicketController {

    private final TicketService ticketService;

    public TicketController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    // GET /api/tickets
    // USER → own tickets | TECHNICIAN → all | ADMIN → own + assigned
    @GetMapping
    public ResponseEntity<List<Ticket>> getTickets(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ticketService.getTicketsForUser(currentUser));
    }

    // GET /api/tickets/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getTicketById(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser) {
        try {
            Ticket ticket = ticketService.getTicketById(id, currentUser);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/tickets
    // Supports both JSON and multipart (with image)
    @PostMapping(consumes = "application/json")
    public ResponseEntity<?> createTicketJson(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        try {
            Ticket ticket = ticketService.createTicket(
                    body.get("title"),
                    body.get("description"),
                    body.get("category"),
                    body.get("priority"),
                    body.getOrDefault("location", ""),
                    new ArrayList<>(),
                    currentUser
            );
            return ResponseEntity.status(201).body(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/tickets (with image upload — up to 3 images)
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> createTicketWithImage(
            @RequestParam("title")       String title,
            @RequestParam("description") String description,
            @RequestParam("category")    String category,
            @RequestParam("priority")    String priority,
            @RequestParam(value = "location", required = false) String location,
            @RequestParam(value = "images", required = false) List<MultipartFile> images,
            @AuthenticationPrincipal User currentUser) {
        try {
            Ticket ticket = ticketService.createTicket(
                    title, description, category, priority,
                    location == null ? "" : location,
                    images == null ? new ArrayList<>() : images,
                    currentUser);
            return ResponseEntity.status(201).body(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // PATCH /api/tickets/{id}/status
    // ADMIN and TECHNICIAN only
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        try {
            String newStatus = body.get("status");
            if (newStatus == null || newStatus.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Status is required"));
            }
            Ticket ticket = ticketService.updateStatus(id, newStatus, currentUser);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // PATCH /api/tickets/{id}/resolve
    // TECHNICIAN and ADMIN only — sets status to RESOLVED + saves resolution note
    @PatchMapping("/{id}/resolve")
    public ResponseEntity<?> resolveTicket(
        @PathVariable String id,
        @RequestBody Map<String, String> body,
        @AuthenticationPrincipal User currentUser) {
    try {
        String note = body.get("resolutionNote");
        if (note == null || note.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Resolution note is required"));
        }
        Ticket ticket = ticketService.resolveTicket(id, note, currentUser);
        return ResponseEntity.ok(ticket);
    } catch (Exception e) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
    }
}

    // PUT /api/tickets/{id}/assign
    // ADMIN only
    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assignTechnician(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        try {
            String technicianId = body.get("technicianId");
            Ticket ticket = ticketService.assignTechnician(id, technicianId, currentUser);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/tickets/{id}/comments
    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {
        try {
            String content = body.get("content");
            if (content == null || content.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Comment content is required"));
            }
            Ticket ticket = ticketService.addComment(id, content, currentUser);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/tickets/{id}/comments/{commentId}
    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(
            @PathVariable String id,
            @PathVariable String commentId,
            @AuthenticationPrincipal User currentUser) {
        try {
            Ticket ticket = ticketService.deleteComment(id, commentId, currentUser);
            return ResponseEntity.ok(ticket);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/tickets/{id}
    // Owner (when OPEN) or ADMIN
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(
            @PathVariable String id,
            @AuthenticationPrincipal User currentUser) {
        try {
            ticketService.deleteTicket(id, currentUser);
            return ResponseEntity.ok(Map.of("message", "Ticket deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}