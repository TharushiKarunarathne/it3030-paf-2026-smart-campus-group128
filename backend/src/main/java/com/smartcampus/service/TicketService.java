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
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class TicketService {

    private final TicketRepository       ticketRepository;
    private final UserRepository         userRepository;
    private final NotificationService    notificationService;
    private final FileStorageService     fileStorageService;

    public TicketService(TicketRepository ticketRepository,
                         UserRepository userRepository,
                         NotificationService notificationService,
                         FileStorageService fileStorageService) {
        this.ticketRepository    = ticketRepository;
        this.userRepository      = userRepository;
        this.notificationService = notificationService;
        this.fileStorageService  = fileStorageService;
    }

    // ─── GET TICKETS BY ROLE ────────────────────────────────────────────────

    public List<Ticket> getTicketsForUser(User currentUser) {
        String role = currentUser.getRole().name();

        switch (role) {
            case "ADMIN":
                // Admin sees ALL tickets so they can assign technicians
                return ticketRepository.findAllByOrderByCreatedAtDesc();

            case "TECHNICIAN":
                // Technician sees only tickets assigned to them
                return ticketRepository
                        .findByAssignedToIdOrderByCreatedAtDesc(currentUser.getId());

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

    String role = currentUser.getRole().name();

    // TECHNICIAN and ADMIN can access any ticket
    if (role.equals("TECHNICIAN") || role.equals("ADMIN")) {
        return ticket;
    }

    // USER can only access their own tickets
    if (!ticket.getReportedById().equals(currentUser.getId())) {
        throw new RuntimeException("Access denied");
    }

    return ticket;
}

    // ─── CREATE TICKET ───────────────────────────────────────────────────────

    public Ticket createTicket(String title,
                               String description,
                               String category,
                               String priority,
                               String location,
                               List<MultipartFile> images,
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

        // Handle image uploads (up to 3)
        if (images != null && !images.isEmpty()) {
            List<String> savedUrls = new ArrayList<>();
            int count = 0;
            for (MultipartFile img : images) {
                if (img != null && !img.isEmpty() && count < 3) {
                    savedUrls.add(fileStorageService.saveTicketImage(img));
                    count++;
                }
            }
            if (!savedUrls.isEmpty()) {
                ticket.setImageUrls(savedUrls);
                ticket.setImageUrl(savedUrls.get(0)); // legacy compat
            }
        }

        Ticket saved = ticketRepository.save(ticket);

        // Notify all admins about the new ticket
        List<User> admins = userRepository.findByRole(User.Role.ADMIN);
        for (User admin : admins) {
            notificationService.createNotification(
                admin.getId(),
                "New ticket from " + currentUser.getName() + ": \"" + title + "\"",
                Notification.NotificationType.TICKET_UPDATED,
                saved.getId()
            );
        }

        return saved;
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

    // ─── RESOLVE WITH NOTE ───────────────────────────────────────────────────

public Ticket resolveTicket(String ticketId, String resolutionNote, User currentUser) {
    // Only TECHNICIAN and ADMIN can resolve
    if (currentUser.getRole() == User.Role.USER) {
        throw new RuntimeException("Users cannot resolve tickets");
    }

    if (resolutionNote == null || resolutionNote.isBlank()) {
        throw new RuntimeException("Resolution note is required");
    }

    Ticket ticket = ticketRepository.findById(ticketId)
            .orElseThrow(() -> new RuntimeException("Ticket not found"));

    if (ticket.getStatus() == Ticket.Status.RESOLVED ||
        ticket.getStatus() == Ticket.Status.CLOSED) {
        throw new RuntimeException("Ticket is already resolved or closed");
    }

    ticket.setStatus(Ticket.Status.RESOLVED);
    ticket.setResolutionNote(resolutionNote.trim());
    ticket.setResolvedAt(LocalDateTime.now());

    Ticket saved = ticketRepository.save(ticket);

    // Notify the reporter
    if (!ticket.getReportedById().equals(currentUser.getId())) {
        notificationService.createNotification(
                ticket.getReportedById(),
                "Your ticket \"" + ticket.getTitle() + "\" has been resolved by " + currentUser.getName(),
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

        // Record first response time when a technician is first assigned
        if (ticket.getFirstResponseAt() == null) {
            ticket.setFirstResponseAt(LocalDateTime.now());
        }

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

        // Record first response time when a staff member first comments
        boolean isStaff = currentUser.getRole() == User.Role.ADMIN
                       || currentUser.getRole() == User.Role.TECHNICIAN;
        if (isStaff && ticket.getFirstResponseAt() == null) {
            ticket.setFirstResponseAt(LocalDateTime.now());
        }

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

        boolean isOwner = ticket.getReportedById().equals(currentUser.getId());
        boolean isAdmin = currentUser.getRole() == User.Role.ADMIN;
        boolean isTechnician = currentUser.getRole() == User.Role.TECHNICIAN;
        boolean isAssignedTechnician = isTechnician &&
                currentUser.getId().equals(ticket.getAssignedToId());
        boolean isResolvedOrClosed = ticket.getStatus() == Ticket.Status.RESOLVED
                || ticket.getStatus() == Ticket.Status.CLOSED;

        // Admin can delete any ticket
        // Technician can delete tickets they resolved/closed
        // Owner can delete their own OPEN tickets
        if (isAdmin) {
            // allowed
        } else if (isAssignedTechnician && isResolvedOrClosed) {
            // allowed
        } else if (isOwner && ticket.getStatus() == Ticket.Status.OPEN) {
            // allowed
        } else {
            throw new RuntimeException("Access denied");
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
}