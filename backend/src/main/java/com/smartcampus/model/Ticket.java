package com.smartcampus.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "tickets")
public class Ticket {

    @Id
    private String id;

    private String title;
    private String description;
    private String location;
    private String category;

    private Priority priority   = Priority.MEDIUM;
    private Status   status     = Status.OPEN;

    // Who reported this ticket
    private String reportedById;
    private String reportedByName;

    // Assigned technician
    private String assignedToId;
    private String assignedToName;

    // Image attachment URLs (up to 3)
    private String imageUrl;                              // legacy single-image field
    private List<String> imageUrls = new ArrayList<>();  // multi-image field
    private String resolutionNote;

    // Embedded comments
    private List<Comment> comments = new ArrayList<>();

    // SLA timers
    private LocalDateTime firstResponseAt;
    private LocalDateTime resolvedAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum Priority { LOW, MEDIUM, HIGH }

    public enum Status { OPEN, IN_PROGRESS, RESOLVED, CLOSED }

    public Ticket() {}

    // Getters
    public String getId()               { return id; }
    public String getTitle()            { return title; }
    public String getDescription()      { return description; }
    public String getLocation()         { return location; }
    public String getCategory()         { return category; }
    public Priority getPriority()       { return priority; }
    public Status getStatus()           { return status; }
    public String getReportedById()     { return reportedById; }
    public String getReportedByName()   { return reportedByName; }
    public String getAssignedToId()     { return assignedToId; }
    public String getAssignedToName()   { return assignedToName; }
    public String getImageUrl()          { return imageUrl; }
    public List<String> getImageUrls()   { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    public String getResolutionNote()              { return resolutionNote; }
    public void setResolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; }
    public List<Comment> getComments()  { return comments; }
    public LocalDateTime getFirstResponseAt()            { return firstResponseAt; }
    public void setFirstResponseAt(LocalDateTime v)      { this.firstResponseAt = v; }
    public LocalDateTime getResolvedAt()                 { return resolvedAt; }
    public void setResolvedAt(LocalDateTime v)           { this.resolvedAt = v; }
    public LocalDateTime getCreatedAt()                  { return createdAt; }
    public LocalDateTime getUpdatedAt()                  { return updatedAt; }

    /** Minutes from creation to first staff response, or null if not yet responded. */
    public Long getTimeToFirstResponseMinutes() {
        if (createdAt == null || firstResponseAt == null) return null;
        return java.time.Duration.between(createdAt, firstResponseAt).toMinutes();
    }

    /** Minutes from creation to resolution, or null if not yet resolved. */
    public Long getTimeToResolutionMinutes() {
        if (createdAt == null || resolvedAt == null) return null;
        return java.time.Duration.between(createdAt, resolvedAt).toMinutes();
    }

    // Setters
    public void setId(String id)                         { this.id = id; }
    public void setTitle(String title)                   { this.title = title; }
    public void setDescription(String description)       { this.description = description; }
    public void setLocation(String location)             { this.location = location; }
    public void setCategory(String category)             { this.category = category; }
    public void setPriority(Priority priority)           { this.priority = priority; }
    public void setStatus(Status status)                 { this.status = status; }
    public void setReportedById(String reportedById)     { this.reportedById = reportedById; }
    public void setReportedByName(String reportedByName) { this.reportedByName = reportedByName; }
    public void setAssignedToId(String assignedToId)     { this.assignedToId = assignedToId; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }
    public void setImageUrl(String imageUrl)             { this.imageUrl = imageUrl; }
    public void setComments(List<Comment> comments)      { this.comments = comments; }
    public void setCreatedAt(LocalDateTime v)             { this.createdAt = v; }
    public void setUpdatedAt(LocalDateTime v)             { this.updatedAt = v; }

    // Helper
    public int getCommentCount() { return comments == null ? 0 : comments.size(); }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Ticket t = new Ticket();
        public Builder title(String v)          { t.title = v; return this; }
        public Builder description(String v)    { t.description = v; return this; }
        public Builder location(String v)       { t.location = v; return this; }
        public Builder category(String v)       { t.category = v; return this; }
        public Builder priority(Priority v)     { t.priority = v; return this; }
        public Builder status(Status v)         { t.status = v; return this; }
        public Builder reportedById(String v)   { t.reportedById = v; return this; }
        public Builder reportedByName(String v) { t.reportedByName = v; return this; }
        public Ticket build()                   { return t; }
    }
}