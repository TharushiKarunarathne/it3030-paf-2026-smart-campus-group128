package com.smartcampus.repository;

import com.smartcampus.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    // All bookings by a specific user
    List<Booking> findByUserId(String userId);

    // All bookings for a specific resource
    List<Booking> findByResourceId(String resourceId);

    // All bookings by status (admin use)
    List<Booking> findByStatus(Booking.BookingStatus status);

    // All bookings by user and status
    List<Booking> findByUserIdAndStatus(String userId, Booking.BookingStatus status);

    // ── Conflict detection query ───────────────────────
    // Find APPROVED bookings for a resource that overlap with the given time slot
    // Overlap condition: existingStart < newEnd AND existingEnd > newStart
    @Query("{ 'resourceId': ?0, 'status': 'APPROVED', 'startTime': { $lt: ?2 }, 'endTime': { $gt: ?1 } }")
    List<Booking> findConflictingBookings(
        String resourceId,
        LocalDateTime newStart,
        LocalDateTime newEnd
    );

    // All bookings for a resource ordered by start time
    List<Booking> findByResourceIdOrderByStartTimeAsc(String resourceId);

    // Analytics: bookings created in the last N days
    List<Booking> findByCreatedAtAfter(LocalDateTime date);

    // Analytics: count by status
    long countByStatus(Booking.BookingStatus status);
}