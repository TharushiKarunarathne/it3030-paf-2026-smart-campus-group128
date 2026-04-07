package com.smartcampus.service;

import com.smartcampus.model.Notification;
import com.smartcampus.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    // Get all notifications for a user
    public List<Notification> getNotifications(String userId) {
        return notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId);
    }

    // Mark a single notification as read
    public Notification markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository
                .findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    // Mark all notifications as read
    public void markAllAsRead(String userId) {
        List<Notification> notifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId);

        notifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(notifications);
    }

    // Delete all read notifications
    public void clearReadNotifications(String userId) {
        notificationRepository.deleteByUserIdAndReadTrue(userId);
    }

    // Create a notification (called internally by other services)
    public Notification createNotification(String userId,
                                           String message,
                                           Notification.NotificationType type,
                                           String entityId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .message(message)
                .type(type)
                .entityId(entityId)
                .read(false)
                .build();
        return notificationRepository.save(notification);
    }
}