package com.smartcampus.service;

import com.smartcampus.model.Booking;
import com.smartcampus.model.Resource;
import com.smartcampus.model.User;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;

    public BookingService(BookingRepository bookingRepository,
                          ResourceRepository resourceRepository) {
        this.bookingRepository  = bookingRepository;
        this.resourceRepository = resourceRepository;
    }

    // ── Get bookings for logged-in user ────────────────

    public List<Booking> getMyBookings(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    // ── Get ALL bookings (admin only) ──────────────────

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    // ── Get single booking ─────────────────────────────

    public Booking getBookingById(String id) {
        return bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    // ── Get bookings for a resource (availability check) ──

    public List<Booking> getBookingsByResource(String resourceId) {
        return bookingRepository.findByResourceIdOrderByStartTimeAsc(resourceId);
    }

    // ── Create booking ─────────────────────────────────

    public Booking createBooking(Map<String, Object> body, User user) {

        String resourceId = (String) body.get("resourceId");
        String startStr   = (String) body.get("startTime");
        String endStr     = (String) body.get("endTime");
        String purpose    = (String) body.get("purpose");

        // ── Validation ─────────────────────────────────

        if (resourceId == null || resourceId.isBlank())
            throw new RuntimeException("Resource ID is required");
        if (startStr == null || endStr == null)
            throw new RuntimeException("Start and end time are required");
        if (purpose == null || purpose.isBlank())
            throw new RuntimeException("Purpose is required");

        LocalDateTime startTime = LocalDateTime.parse(startStr.replace("Z", ""));
        LocalDateTime endTime   = LocalDateTime.parse(endStr.replace("Z", ""));

        // End must be after start
        if (!endTime.isAfter(startTime))
            throw new RuntimeException("End time must be after start time");

        // Cannot book in the past
        if (startTime.isBefore(LocalDateTime.now()))
            throw new RuntimeException("Cannot book a time slot in the past");

        // Minimum 30 minutes
        long minutes = java.time.Duration.between(startTime, endTime).toMinutes();
        if (minutes < 30)
            throw new RuntimeException("Minimum booking duration is 30 minutes");

        // Maximum 8 hours
        if (minutes > 480)
            throw new RuntimeException("Maximum booking duration is 8 hours");

        // ── Resource check ─────────────────────────────

        Resource resource = resourceRepository.findById(resourceId)
            .orElseThrow(() -> new RuntimeException("Resource not found"));

        if (resource.getStatus() != Resource.ResourceStatus.AVAILABLE)
            throw new RuntimeException(
                "Resource is not available for booking (status: " + resource.getStatus() + ")"
            );

        // ── Conflict detection ─────────────────────────
        // Check if any APPROVED booking already exists for this slot

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
            resourceId, startTime, endTime
        );

        if (!conflicts.isEmpty()) {
            Booking conflict = conflicts.get(0);
            throw new RuntimeException(
                "Time slot is already booked from " +
                conflict.getStartTime() + " to " + conflict.getEndTime()
            );
        }

        // ── Build and save ─────────────────────────────

        Booking booking = new Booking();
        booking.setResourceId(resourceId);
        booking.setResourceName(resource.getName());
        booking.setResourceType(resource.getType() != null
            ? resource.getType().name() : null);
        booking.setUserId(user.getId());
        booking.setUserName(user.getName());
        booking.setUserEmail(user.getEmail());
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setPurpose(purpose);
        booking.setStatus(Booking.BookingStatus.PENDING);

        return bookingRepository.save(booking);
    }

    // ── Update booking status (admin only) ────────────

    public Booking updateStatus(String id, String status, String adminNote, User admin) {
        Booking booking = getBookingById(id);

        Booking.BookingStatus newStatus;
        try {
            newStatus = Booking.BookingStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }

        // Can only update PENDING bookings
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new RuntimeException(
                "Cannot update a booking that is already " + booking.getStatus()
            );
        }

        // Rejection requires a reason
        if (newStatus == Booking.BookingStatus.REJECTED &&
            (adminNote == null || adminNote.isBlank())) {
            throw new RuntimeException("Please provide a reason for rejection");
        }

        // If approving — re-check for conflicts (another booking may have
        // been approved in the meantime)
        if (newStatus == Booking.BookingStatus.APPROVED) {
            List<Booking> conflicts = bookingRepository.findConflictingBookings(
                booking.getResourceId(),
                booking.getStartTime(),
                booking.getEndTime()
            );
            // Exclude this booking itself from conflict check
            conflicts.removeIf(c -> c.getId().equals(id));

            if (!conflicts.isEmpty()) {
                throw new RuntimeException(
                    "Cannot approve — time slot conflicts with another approved booking"
                );
            }
        }

        booking.setStatus(newStatus);
        if (adminNote != null && !adminNote.isBlank()) {
            booking.setAdminNote(adminNote);
        }

        return bookingRepository.save(booking);
    }

    // ── Delete / cancel booking ────────────────────────

    public void deleteBooking(String id, User requestingUser) {
        Booking booking = getBookingById(id);

        boolean isAdmin = requestingUser.getRole() != null &&
                          requestingUser.getRole().name().equals("ADMIN");
        boolean isOwner = booking.getUserId().equals(requestingUser.getId());

        // Only owner (if PENDING) or admin can cancel
        if (!isAdmin && !isOwner) {
            throw new RuntimeException("You are not allowed to cancel this booking");
        }

        if (!isAdmin && booking.getStatus() == Booking.BookingStatus.APPROVED) {
            throw new RuntimeException("Cannot cancel an already approved booking");
        }

        bookingRepository.deleteById(id);
    }
}