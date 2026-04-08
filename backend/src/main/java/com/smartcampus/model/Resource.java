package com.smartcampus.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.util.Map;

@Document(collection = "resources")
public class Resource {

    @Id
    private String id;

    @Indexed
    private String name;

    private ResourceType type;

    private String location;

    private Integer capacity;

    private String description;

    private ResourceStatus status = ResourceStatus.AVAILABLE;

    // Stores type-specific fields
    // e.g. for VEHICLE: vehicleNumber, brand, model, fuelType
    // e.g. for COMPUTER_LAB: numberOfComputers, software
    private Map<String, Object> details;

    // Who created this resource
    private String createdBy;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // ── Enums ──────────────────────────────────────────

    public enum ResourceType {
        LECTURE_HALL,
        COMPUTER_LAB,
        SPORTS_FACILITY,
        MEETING_ROOM,
        VEHICLE,
        LIBRARY_STUDY_ROOM
    }

    public enum ResourceStatus {
        AVAILABLE,
        MAINTENANCE,
        UNAVAILABLE
    }

    // ── Constructors ───────────────────────────────────

    public Resource() {}

    // ── Getters ────────────────────────────────────────

    public String getId()                    { return id; }
    public String getName()                  { return name; }
    public ResourceType getType()            { return type; }
    public String getLocation()              { return location; }
    public Integer getCapacity()             { return capacity; }
    public String getDescription()           { return description; }
    public ResourceStatus getStatus()        { return status; }
    public Map<String, Object> getDetails()  { return details; }
    public String getCreatedBy()             { return createdBy; }
    public LocalDateTime getCreatedAt()      { return createdAt; }
    public LocalDateTime getUpdatedAt()      { return updatedAt; }

    // ── Setters ────────────────────────────────────────

    public void setId(String id)                         { this.id = id; }
    public void setName(String name)                     { this.name = name; }
    public void setType(ResourceType type)               { this.type = type; }
    public void setLocation(String location)             { this.location = location; }
    public void setCapacity(Integer capacity)            { this.capacity = capacity; }
    public void setDescription(String description)       { this.description = description; }
    public void setStatus(ResourceStatus status)         { this.status = status; }
    public void setDetails(Map<String, Object> details)  { this.details = details; }
    public void setCreatedBy(String createdBy)           { this.createdBy = createdBy; }
    public void setCreatedAt(LocalDateTime createdAt)    { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt)    { this.updatedAt = updatedAt; }

    // ── Builder ────────────────────────────────────────

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private final Resource r = new Resource();

        public Builder name(String name)                    { r.name = name; return this; }
        public Builder type(ResourceType type)              { r.type = type; return this; }
        public Builder location(String location)            { r.location = location; return this; }
        public Builder capacity(Integer capacity)           { r.capacity = capacity; return this; }
        public Builder description(String description)      { r.description = description; return this; }
        public Builder status(ResourceStatus status)        { r.status = status; return this; }
        public Builder details(Map<String, Object> details) { r.details = details; return this; }
        public Builder createdBy(String createdBy)          { r.createdBy = createdBy; return this; }
        public Resource build()                             { return r; }
    }
}