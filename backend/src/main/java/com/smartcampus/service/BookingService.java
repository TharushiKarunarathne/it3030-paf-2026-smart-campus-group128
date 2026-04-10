package com.smartcampus.service;

import com.smartcampus.model.Booking;
import com.smartcampus.model.Notification;
import com.smartcampus.model.Resource;
import com.smartcampus.model.User;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository,
                          ResourceRepository resourceRepository,
                          UserRepository userRepository,
                          NotificationService notificationService) {
        this.bookingRepository   = bookingRepository;
        this.resourceRepository  = resourceRepository;
        this.userRepository      = userRepository;
        this.notificationService = notificationService;
    }

    public List<Booking> getMyBookings(String userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(String id) {
        return bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
    }

    public List<Booking> getBookingsByResource(String resourceId) {
        return bookingRepository.findByResourceIdOrderByStartTimeAsc(resourceId);
    }

    public Booking createBooking(Map<String, Object> body, User user) {

        String resourceId = (String) body.get("resourceId");
        String startStr   = (String) body.get("startTime");
        String endStr     = (String) body.get("endTime");
        String purpose    = (String) body.get("purpose");

        if (resourceId == null || resourceId.isBlank())
            throw new RuntimeException("Resource ID is required");
        if (startStr == null || endStr == null)
            throw new RuntimeException("Start and end time are required");
        if (purpose == null || purpose.isBlank())
            throw new RuntimeException("Purpose is required");

        LocalDateTime startTime = LocalDateTime.parse(startStr.replace("Z", ""));
        LocalDateTime endTime   = LocalDateTime.parse(endStr.replace("Z", ""));

        if (!endTime.isAfter(startTime))
            throw new RuntimeException("End time must be after start time");

        if (startTime.isBefore(LocalDateTime.now()))
            throw new RuntimeException("Cannot book a time slot in the past");

        long minutes = java.time.Duration.between(startTime, endTime).toMinutes();
        if (minutes < 30)
            throw new RuntimeException("Minimum booking duration is 30 minutes");
        if (minutes > 480)
            throw new RuntimeException("Maximum booking duration is 8 hours");

        Resource resource = resourceRepository.findById(resourceId)
            .orElseThrow(() -> new RuntimeException("Resource not found"));

        if (resource.getStatus() != Resource.ResourceStatus.AVAILABLE)
            throw new RuntimeException(
                "Resource is not available for booking (status: "
                + resource.getStatus() + ")"
            );

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

        // Optional: expected attendees
        Object attendeesRaw = body.get("expectedAttendees");
        if (attendeesRaw != null) {
            try {
                int attendees = Integer.parseInt(attendeesRaw.toString());
                if (attendees > 0) booking.setExpectedAttendees(attendees);
            } catch (NumberFormatException ignored) {}
        }

        Booking saved = bookingRepository.save(booking);

        // Notify all admins about the new booking request
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(
                admin.getId(),
                "New booking request from " + user.getName() + " for \"" + resource.getName() + "\"",
                Notification.NotificationType.BOOKING_PENDING,
                booking.getId()
            );
        }

        return saved;
    }

    public Booking updateStatus(String id, String status, String adminNote, User admin) {
        Booking booking = getBookingById(id);

        Booking.BookingStatus newStatus;
        try {
            newStatus = Booking.BookingStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status: " + status);
        }

        // Revert to PENDING — always allowed for admin
        if (newStatus == Booking.BookingStatus.PENDING) {
            booking.setStatus(Booking.BookingStatus.PENDING);
            booking.setAdminNote(null);
            booking.setCheckedInAt(null);
            Booking saved = bookingRepository.save(booking);
            notificationService.createNotification(
                booking.getUserId(),
                "Your booking for \"" + booking.getResourceName() + "\" has been reverted to pending review.",
                Notification.NotificationType.BOOKING_CANCELLED,
                booking.getId()
            );
            return saved;
        }

        // Normal flow — booking must be PENDING
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new RuntimeException(
                "This booking is already " + booking.getStatus() +
                ". Use the Revert button first."
            );
        }

        if (newStatus == Booking.BookingStatus.REJECTED &&
            (adminNote == null || adminNote.isBlank())) {
            throw new RuntimeException("Please provide a reason for rejection");
        }

        if (newStatus == Booking.BookingStatus.APPROVED) {
            List<Booking> conflicts = bookingRepository.findConflictingBookings(
                booking.getResourceId(),
                booking.getStartTime(),
                booking.getEndTime()
            );
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

        Booking saved = bookingRepository.save(booking);

        if (newStatus == Booking.BookingStatus.APPROVED) {
            notificationService.createNotification(
                booking.getUserId(),
                "Your booking for \"" + booking.getResourceName() + "\" has been approved.",
                Notification.NotificationType.BOOKING_APPROVED,
                booking.getId()
            );
        } else if (newStatus == Booking.BookingStatus.REJECTED) {
            String reason = (adminNote != null && !adminNote.isBlank())
                ? " Reason: " + adminNote
                : "";
            notificationService.createNotification(
                booking.getUserId(),
                "Your booking for \"" + booking.getResourceName() + "\" has been rejected." + reason,
                Notification.NotificationType.BOOKING_REJECTED,
                booking.getId()
            );
        }

        return saved;
    }

    // ── Check In ───────────────────────────────────────
    // Called from the QR verification screen
    // No auth required — public endpoint
    public Booking checkIn(String id) {
        Booking booking = getBookingById(id);

        // Can only check in APPROVED bookings
        if (booking.getStatus() != Booking.BookingStatus.APPROVED) {
            throw new RuntimeException(
                "Cannot check in — booking status is " + booking.getStatus()
            );
        }

        booking.setStatus(Booking.BookingStatus.CHECKED_IN);
        booking.setCheckedInAt(LocalDateTime.now());

        return bookingRepository.save(booking);
    }

    public void deleteBooking(String id, User requestingUser) {
        Booking booking = getBookingById(id);

        boolean isAdmin = requestingUser.getRole() != null &&
                          requestingUser.getRole().name().equals("ADMIN");
        boolean isOwner = booking.getUserId().equals(requestingUser.getId());

        if (!isAdmin && !isOwner)
            throw new RuntimeException("You are not allowed to cancel this booking");

        if (!isAdmin && booking.getStatus() == Booking.BookingStatus.APPROVED)
            throw new RuntimeException("Cannot cancel an already approved booking");

        // Notify the booking owner if an admin is cancelling their booking
        if (isAdmin && !isOwner) {
            notificationService.createNotification(
                booking.getUserId(),
                "Your booking for \"" + booking.getResourceName() + "\" has been cancelled by an administrator.",
                Notification.NotificationType.BOOKING_CANCELLED,
                booking.getId()
            );
        }

        bookingRepository.deleteById(id);
    }
}