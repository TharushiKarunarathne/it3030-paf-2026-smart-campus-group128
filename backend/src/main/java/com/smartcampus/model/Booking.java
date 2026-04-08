package com.smartcampus.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    // Resource info
    @Indexed
    private String resourceId;
    private String resourceName;   // snapshot — stays even if resource renamed
    private String resourceType;   // snapshot for display

    // User info
    @Indexed
    private String userId;
    private String userName;       // snapshot
    private String userEmail;      // snapshot

    // Time slot
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    // Details
    private String purpose;

    // Status
    private BookingStatus status = BookingStatus.PENDING;
    private String adminNote;      // rejection reason or approval note

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // ── Enum ──────────────────────────────────────────

    public enum BookingStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    // ── Constructors ───────────────────────────────────

    public Booking() {}

    // ── Getters ────────────────────────────────────────

    public String getId()                  { return id; }
    public String getResourceId()          { return resourceId; }
    public String getResourceName()        { return resourceName; }
    public String getResourceType()        { return resourceType; }
    public String getUserId()              { return userId; }
    public String getUserName()            { return userName; }
    public String getUserEmail()           { return userEmail; }
    public LocalDateTime getStartTime()    { return startTime; }
    public LocalDateTime getEndTime()      { return endTime; }
    public String getPurpose()             { return purpose; }
    public BookingStatus getStatus()       { return status; }
    public String getAdminNote()           { return adminNote; }
    public LocalDateTime getCreatedAt()    { return createdAt; }
    public LocalDateTime getUpdatedAt()    { return updatedAt; }

    // ── Setters ────────────────────────────────────────

    public void setId(String id)                        { this.id = id; }
    public void setResourceId(String resourceId)        { this.resourceId = resourceId; }
    public void setResourceName(String resourceName)    { this.resourceName = resourceName; }
    public void setResourceType(String resourceType)    { this.resourceType = resourceType; }
    public void setUserId(String userId)                { this.userId = userId; }
    public void setUserName(String userName)            { this.userName = userName; }
    public void setUserEmail(String userEmail)          { this.userEmail = userEmail; }
    public void setStartTime(LocalDateTime startTime)   { this.startTime = startTime; }
    public void setEndTime(LocalDateTime endTime)       { this.endTime = endTime; }
    public void setPurpose(String purpose)              { this.purpose = purpose; }
    public void setStatus(BookingStatus status)         { this.status = status; }
    public void setAdminNote(String adminNote)          { this.adminNote = adminNote; }
    public void setCreatedAt(LocalDateTime createdAt)   { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt)   { this.updatedAt = updatedAt; }
}