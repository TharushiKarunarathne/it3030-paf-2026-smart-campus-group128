package com.smartcampus.repository;

import com.smartcampus.model.Ticket;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends MongoRepository<Ticket, String> {

    // USER — get their own tickets
    List<Ticket> findByReportedByIdOrderByCreatedAtDesc(String reportedById);

    // TECHNICIAN — all tickets ordered by newest first
    List<Ticket> findAllByOrderByCreatedAtDesc();

    // ADMIN — tickets they created OR are assigned to
    List<Ticket> findByReportedByIdOrAssignedToIdOrderByCreatedAtDesc(
            String reportedById, String assignedToId);

    // Filter by status (for technician dashboard)
    List<Ticket> findByStatusOrderByCreatedAtDesc(Ticket.Status status);

    // TECHNICIAN — tickets assigned to them
    List<Ticket> findByAssignedToIdOrderByCreatedAtDesc(String assignedToId);

    // Filter by assigned technician + status
    List<Ticket> findByAssignedToIdAndStatusOrderByCreatedAtDesc(
            String assignedToId, Ticket.Status status);

    // Analytics: count by status
    long countByStatus(Ticket.Status status);

    // Analytics: tickets created in the last N days
    List<Ticket> findByCreatedAtAfter(java.time.LocalDateTime date);
}