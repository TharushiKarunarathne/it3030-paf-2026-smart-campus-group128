package com.smartcampus.service;

import com.smartcampus.model.Comment;
import com.smartcampus.model.Notification;
import com.smartcampus.model.Ticket;
import com.smartcampus.model.User;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
public class TicketService {

    private final TicketRepository       ticketRepository;
    private final UserRepository         userRepository;
    private final NotificationService    notificationService;

    public TicketService(TicketRepository ticketRepository,
                         UserRepository userRepository,
                         NotificationService notificationService) {
        this.ticketRepository    = ticketRepository;
        this.userRepository      = userRepository;
        this.notificationService = notificationService;
    }

    // ─── GET TICKETS BY ROLE ────────────────────────────────────────────────

    public List<Ticket> getTicketsForUser(User currentUser) {
        String role = currentUser.getRole().name();

        switch (role) {
            case "TECHNICIAN":
                // Technician sees ALL tickets
                return ticketRepository.findAllByOrderByCreatedAtDesc();

            case "ADMIN":
                // Admin sees tickets they created OR assigned to them
                return ticketRepository
                        .findByReportedByIdOrAssignedToIdOrderByCreatedAtDesc(
                                currentUser.getId(), currentUser.getId());

            default:
                // Regular USER sees only their own tickets
                return ticketRepository
                        .findByReportedByIdOrderByCreatedAtDesc(currentUser.getId());
        }
    }

    // ─── GET SINGLE TICKET ───────────────────────────────────────────────────

    public Ticket getTicketById(String ticketId, User currentUser) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // Check access
        String role = currentUser.getRole().name();
        if (role.equals("USER") && !ticket.getReportedById().equals(currentUser.getId())) {
            throw new RuntimeException("Access denied");
        }
        if (role.equals("ADMIN") &&
                !ticket.getReportedById().equals(currentUser.getId()) &&
                !currentUser.getId().equals(ticket.getAssignedToId())) {
            throw new RuntimeException("Access denied");
        }
        // TECHNICIAN can access any ticket

        return ticket;
    }

    // ─── CREATE TICKET ───────────────────────────────────────────────────────

    public Ticket createTicket(String title,
                               String description,
                               String category,
                               String priority,
                               String location,
                               MultipartFile image,
                               User currentUser) throws IOException {

        // Technicians cannot create tickets
        if (currentUser.getRole() == User.Role.TECHNICIAN) {
            throw new RuntimeException("Technicians cannot create tickets");
        }

        Ticket ticket = Ticket.builder()
                .title(title)
                .description(description)
                .category(category)
                .priority(parsePriority(priority))
                .location(location)
                .status(Ticket.Status.OPEN)
                .reportedById(currentUser.getId())
                .reportedByName(currentUser.getName())
                .build();

        // Handle image upload
        if (image != null && !image.isEmpty()) {
            String imageUrl = saveImage(image);
            ticket.setImageUrl(imageUrl);
        }

        return ticketRepository.save(ticket);
    }

    // ─── UPDATE STATUS ───────────────────────────────────────────────────────

    public Ticket updateStatus(String ticketId, String newStatus, User currentUser) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // Only ADMIN and TECHNICIAN can change status
        if (currentUser.getRole() == User.Role.USER) {
            throw new RuntimeException("Users cannot change ticket status");
        }

        Ticket.Status status = parseStatus(newStatus);
        ticket.setStatus(status);
        Ticket saved = ticketRepository.save(ticket);

        // Notify the ticket reporter
        if (!ticket.getReportedById().equals(currentUser.getId())) {
            notificationService.createNotification(
                    ticket.getReportedById(),
                    "Your ticket \"" + ticket.getTitle() + "\" is now " + status.name().replace("_", " "),
                    Notification.NotificationType.TICKET_UPDATED,
                    ticketId
            );
        }

        return saved;
    }

    // ─── ASSIGN TECHNICIAN ───────────────────────────────────────────────────

    public Ticket assignTechnician(String ticketId, String technicianId, User currentUser) {
        // Only ADMIN can assign
        if (currentUser.getRole() != User.Role.ADMIN) {
            throw new RuntimeException("Only admins can assign technicians");
        }

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // Unassign if empty
        if (technicianId == null || technicianId.isBlank()) {
            ticket.setAssignedToId(null);
            ticket.setAssignedToName(null);
            return ticketRepository.save(ticket);
        }

        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("Technician not found"));

        ticket.setAssignedToId(technician.getId());
        ticket.setAssignedToName(technician.getName());

        // Auto move to IN_PROGRESS if still OPEN
        if (ticket.getStatus() == Ticket.Status.OPEN) {
            ticket.setStatus(Ticket.Status.IN_PROGRESS);
        }

        Ticket saved = ticketRepository.save(ticket);

        // Notify the assigned technician
        notificationService.createNotification(
                technicianId,
                "You have been assigned to ticket: \"" + ticket.getTitle() + "\"",
                Notification.NotificationType.TICKET_UPDATED,
                ticketId
        );

        // Notify the reporter
        notificationService.createNotification(
                ticket.getReportedById(),
                "A technician has been assigned to your ticket: \"" + ticket.getTitle() + "\"",
                Notification.NotificationType.TICKET_UPDATED,
                ticketId
        );

        return saved;
    }

    // ─── ADD COMMENT ─────────────────────────────────────────────────────────

    public Ticket addComment(String ticketId, String content, User currentUser) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        Comment comment = new Comment(
                content,
                currentUser.getId(),
                currentUser.getName(),
                currentUser.getRole().name()
        );

        ticket.getComments().add(comment);
        Ticket saved = ticketRepository.save(ticket);

        // Notify reporter if commenter is someone else
        if (!ticket.getReportedById().equals(currentUser.getId())) {
            notificationService.createNotification(
                    ticket.getReportedById(),
                    currentUser.getName() + " commented on your ticket: \"" + ticket.getTitle() + "\"",
                    Notification.NotificationType.NEW_COMMENT,
                    ticketId
            );
        }

        // Notify assigned technician if they didn't comment
        if (ticket.getAssignedToId() != null &&
                !ticket.getAssignedToId().equals(currentUser.getId())) {
            notificationService.createNotification(
                    ticket.getAssignedToId(),
                    currentUser.getName() + " commented on ticket: \"" + ticket.getTitle() + "\"",
                    Notification.NotificationType.NEW_COMMENT,
                    ticketId
            );
        }

        return saved;
    }

    // ─── DELETE COMMENT ──────────────────────────────────────────────────────

    public Ticket deleteComment(String ticketId, String commentId, User currentUser) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        boolean removed = ticket.getComments().removeIf(c ->
                c.getId().equals(commentId) &&
                (c.getAuthorId().equals(currentUser.getId()) ||
                 currentUser.getRole() == User.Role.ADMIN)
        );

        if (!removed) {
            throw new RuntimeException("Comment not found or access denied");
        }

        return ticketRepository.save(ticket);
    }

    // ─── DELETE TICKET ───────────────────────────────────────────────────────

    public void deleteTicket(String ticketId, User currentUser) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // Only owner or admin can delete, and only if OPEN
        boolean isOwner = ticket.getReportedById().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new RuntimeException("Access denied");
        }
        if (!isAdmin && ticket.getStatus() != Ticket.Status.OPEN) {
            throw new RuntimeException("Only open tickets can be deleted");
        }

        ticketRepository.deleteById(ticketId);
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────

    private Ticket.Priority parsePriority(String priority) {
        try {
            return Ticket.Priority.valueOf(priority.toUpperCase());
        } catch (Exception e) {
            return Ticket.Priority.MEDIUM;
        }
    }

    private Ticket.Status parseStatus(String status) {
        try {
            return Ticket.Status.valueOf(status.toUpperCase());
        } catch (Exception e) {
            throw new RuntimeException("Invalid status: " + status);
        }
    }

    private String saveImage(MultipartFile image) throws IOException {
        // Save to uploads folder — returns a relative URL
        String uploadDir = "uploads/tickets/";
        Path uploadPath  = Paths.get(uploadDir);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String filename  = UUID.randomUUID() + "_" + image.getOriginalFilename();
        Path   filePath  = uploadPath.resolve(filename);
        Files.copy(image.getInputStream(), filePath);

        return "/" + uploadDir + filename;
    }
}