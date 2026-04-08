package com.smartcampus.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;
    private String userId;
    private String message;
    private NotificationType type;
    private String entityId;
    private boolean read = false;

    @CreatedDate
    private LocalDateTime createdAt;

    public enum NotificationType {
        BOOKING_PENDING, BOOKING_APPROVED, BOOKING_REJECTED, BOOKING_CANCELLED,
        TICKET_UPDATED, NEW_COMMENT
    }

    public Notification() {}

    // Getters
    public String getId()              { return id; }
    public String getUserId()          { return userId; }
    public String getMessage()         { return message; }
    public NotificationType getType()  { return type; }
    public String getEntityId()        { return entityId; }
    public boolean isRead()            { return read; }
    public LocalDateTime getCreatedAt(){ return createdAt; }

    // Setters
    public void setId(String id)                     { this.id = id; }
    public void setUserId(String userId)             { this.userId = userId; }
    public void setMessage(String message)           { this.message = message; }
    public void setType(NotificationType type)       { this.type = type; }
    public void setEntityId(String entityId)         { this.entityId = entityId; }
    public void setRead(boolean read)                { this.read = read; }
    public void setCreatedAt(LocalDateTime createdAt){ this.createdAt = createdAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Notification n = new Notification();
        public Builder userId(String userId)           { n.userId = userId; return this; }
        public Builder message(String message)         { n.message = message; return this; }
        public Builder type(NotificationType type)     { n.type = type; return this; }
        public Builder entityId(String entityId)       { n.entityId = entityId; return this; }
        public Builder read(boolean read)              { n.read = read; return this; }
        public Notification build()                    { return n; }
    }
}