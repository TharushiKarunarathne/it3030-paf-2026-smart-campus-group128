package com.smartcampus.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

// MongoDB document model for storing support ticket details
@Document(collection = "tickets")
public class Ticket {

    // Primary key for the ticket document
    @Id
    private String id;

    // Basic ticket details entered when creating the ticket
    private String title;
    private String description;
    private String location;
    private String category;

    // Ticket priority and current workflow status with default values
    private Priority priority   = Priority.MEDIUM;
    private Status   status     = Status.OPEN;

    // Details of the user who reported the ticket
    private String reportedById;
    private String reportedByName;

    // Details of the staff member / technician assigned to handle the ticket
    private String assignedToId;
    private String assignedToName;

    // Image attachment support: legacy single image and new multi-image list
    private String imageUrl;                              // legacy single-image field
    private List<String> imageUrls = new ArrayList<>();  // multi-image field
    private String resolutionNote;

    // List of embedded comments related to the ticket
    private List<Comment> comments = new ArrayList<>();

    // SLA-related timestamps used to calculate response and resolution times
    private LocalDateTime firstResponseAt;
    private LocalDateTime resolvedAt;

    // Automatically managed audit timestamps for creation and last update
    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Enum for defining available ticket priority levels
    public enum Priority { LOW, MEDIUM, HIGH }

    // Enum for defining available ticket status values
    public enum Status { OPEN, IN_PROGRESS, RESOLVED, CLOSED }

    // Default constructor
    public Ticket() {}

    // Getter methods for retrieving ticket field values
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
    public String getImageUrl()         { return imageUrl; }
    public List<String> getImageUrls()  { return imageUrls; }
    public void setImageUrls(List<String> imageUrls) { this.imageUrls = imageUrls; }
    public String getResolutionNote()   { return resolutionNote; }
    public void setResolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; }
    public List<Comment> getComments()  { return comments; }
    public LocalDateTime getFirstResponseAt()       { return firstResponseAt; }
    public void setFirstResponseAt(LocalDateTime v) { this.firstResponseAt = v; }
    public LocalDateTime getResolvedAt()            { return resolvedAt; }
    public void setResolvedAt(LocalDateTime v)      { this.resolvedAt = v; }
    public LocalDateTime getCreatedAt()             { return createdAt; }
    public LocalDateTime getUpdatedAt()             { return updatedAt; }

    // Calculates the time taken for the first response in minutes
    public Long getTimeToFirstResponseMinutes() {
        if (createdAt == null || firstResponseAt == null) return null;
        return java.time.Duration.between(createdAt, firstResponseAt).toMinutes();
    }

    // Calculates the total time taken to resolve the ticket in minutes
    public Long getTimeToResolutionMinutes() {
        if (createdAt == null || resolvedAt == null) return null;
        return java.time.Duration.between(createdAt, resolvedAt).toMinutes();
    }

    // Setter methods for updating ticket field values
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
    public void setCreatedAt(LocalDateTime v)            { this.createdAt = v; }
    public void setUpdatedAt(LocalDateTime v)            { this.updatedAt = v; }

    // Helper method to return the total number of comments in the ticket
    public int getCommentCount() { return comments == null ? 0 : comments.size(); }

    // Returns a builder instance for creating Ticket objects more cleanly
    public static Builder builder() { return new Builder(); }

    // Builder pattern implementation for simplified Ticket object creation
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