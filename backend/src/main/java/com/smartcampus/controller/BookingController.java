package com.smartcampus.controller;

import com.smartcampus.model.Booking;
import com.smartcampus.model.User;
import com.smartcampus.service.BookingService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    // GET /api/bookings
    // Regular user sees their own bookings only
    @GetMapping
    public ResponseEntity<List<Booking>> getMyBookings(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(bookingService.getMyBookings(user.getId()));
    }

    // GET /api/bookings/all — Admin only
    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Booking>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    // GET /api/bookings/{id}
    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        try {
            Booking booking = bookingService.getBookingById(id);

            // Only owner or admin can view
            boolean isAdmin = user.getRole() != null &&
                              user.getRole().name().equals("ADMIN");
            boolean isOwner = booking.getUserId().equals(user.getId());

            if (!isAdmin && !isOwner) {
                return ResponseEntity.status(403)
                    .body(Map.of("error", "Access denied"));
            }

            return ResponseEntity.ok(booking);
        } catch (Exception e) {
            return ResponseEntity.status(404)
                .body(Map.of("error", e.getMessage()));
        }
    }

    // GET /api/bookings/resource/{resourceId}
    // Check availability for a resource
    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<List<Booking>> getBookingsByResource(
            @PathVariable String resourceId) {
        return ResponseEntity.ok(
            bookingService.getBookingsByResource(resourceId)
        );
    }

    // POST /api/bookings — Any logged-in user
    @PostMapping
    public ResponseEntity<?> createBooking(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        try {
            Booking created = bookingService.createBooking(body, user);
            return ResponseEntity.status(201).body(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    // PATCH /api/bookings/{id}/status — Admin only
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        try {
            String status    = body.get("status");
            String adminNote = body.get("adminNote");

            if (status == null) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Status is required"));
            }

            Booking updated = bookingService.updateStatus(id, status, adminNote, user);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

    // DELETE /api/bookings/{id}
    // Owner can cancel PENDING, Admin can cancel any
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(
            @PathVariable String id,
            @AuthenticationPrincipal User user) {
        try {
            bookingService.deleteBooking(id, user);
            return ResponseEntity.ok(Map.of("message", "Booking cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }
}