package com.smartcampus.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Document(collection = "users")
public class User {

    @Id
    private String id;
    private String name;

    @Indexed(unique = true)
    private String email;

    private String password;
    private String picture;
    private String googleId;
    private Role role = Role.USER;
    private boolean enabled = true;

    private NotificationPreferences notificationPreferences = new NotificationPreferences();

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    public enum Role { USER, TECHNICIAN, ADMIN }

    // ── Notification Preferences ──────────────────────────────────────────────
    public static class NotificationPreferences {
        private boolean bookingUpdates = true;
        private boolean ticketUpdates  = true;
        private boolean commentUpdates = true;

        public NotificationPreferences() {}

        public boolean isBookingUpdates()                       { return bookingUpdates; }
        public boolean isTicketUpdates()                        { return ticketUpdates; }
        public boolean isCommentUpdates()                       { return commentUpdates; }
        public void setBookingUpdates(boolean bookingUpdates)   { this.bookingUpdates = bookingUpdates; }
        public void setTicketUpdates(boolean ticketUpdates)     { this.ticketUpdates = ticketUpdates; }
        public void setCommentUpdates(boolean commentUpdates)   { this.commentUpdates = commentUpdates; }
    }

    public User() {}

    // Getters
    public String getId()            { return id; }
    public String getName()          { return name; }
    public String getEmail()         { return email; }
    public String getPassword()      { return password; }
    public String getPicture()       { return picture; }
    public String getGoogleId()      { return googleId; }
    public Role   getRole()          { return role; }
    public boolean isEnabled()       { return enabled; }
    public NotificationPreferences getNotificationPreferences() { return notificationPreferences; }
    public LocalDateTime getCreatedAt()  { return createdAt; }
    public LocalDateTime getUpdatedAt()  { return updatedAt; }

    // Setters
    public void setId(String id)             { this.id = id; }
    public void setName(String name)         { this.name = name; }
    public void setEmail(String email)       { this.email = email; }
    public void setPassword(String password) { this.password = password; }
    public void setPicture(String picture)   { this.picture = picture; }
    public void setGoogleId(String googleId) { this.googleId = googleId; }
    public void setRole(Role role)           { this.role = role; }
    public void setEnabled(boolean enabled)  { this.enabled = enabled; }
    public void setNotificationPreferences(NotificationPreferences notificationPreferences) {
        this.notificationPreferences = notificationPreferences;
    }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // Builder
    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final User user = new User();
        public Builder id(String id)             { user.id = id; return this; }
        public Builder name(String name)         { user.name = name; return this; }
        public Builder email(String email)       { user.email = email; return this; }
        public Builder password(String password) { user.password = password; return this; }
        public Builder picture(String picture)   { user.picture = picture; return this; }
        public Builder googleId(String googleId) { user.googleId = googleId; return this; }
        public Builder role(Role role)           { user.role = role; return this; }
        public Builder enabled(boolean enabled)  { user.enabled = enabled; return this; }
        public User build()                      { return user; }
    }
}