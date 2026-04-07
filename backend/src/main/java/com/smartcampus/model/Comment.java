package com.smartcampus.model;

import java.time.LocalDateTime;
import java.util.UUID;

public class Comment {

    private String id;
    private String content;
    private String authorId;
    private String authorName;
    private String authorRole;
    private LocalDateTime createdAt;

    public Comment() {}

    public Comment(String content, String authorId, String authorName, String authorRole) {
        this.id         = UUID.randomUUID().toString();
        this.content    = content;
        this.authorId   = authorId;
        this.authorName = authorName;
        this.authorRole = authorRole;
        this.createdAt  = LocalDateTime.now();
    }

    // Getters
    public String getId()           { return id; }
    public String getContent()      { return content; }
    public String getAuthorId()     { return authorId; }
    public String getAuthorName()   { return authorName; }
    public String getAuthorRole()   { return authorRole; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    // Setters
    public void setId(String id)               { this.id = id; }
    public void setContent(String content)     { this.content = content; }
    public void setAuthorId(String authorId)   { this.authorId = authorId; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }
    public void setAuthorRole(String authorRole) { this.authorRole = authorRole; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}