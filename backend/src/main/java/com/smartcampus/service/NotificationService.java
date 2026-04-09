package com.smartcampus.service;

import com.smartcampus.model.Notification;
import com.smartcampus.model.User;
import com.smartcampus.repository.NotificationRepository;
import com.smartcampus.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository         userRepository;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository         = userRepository;
    }

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
    // Respects the target user's notification preferences — returns null if suppressed.
    public Notification createNotification(String userId,
                                           String message,
                                           Notification.NotificationType type,
                                           String entityId) {
        // Check user preferences before saving
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            User.NotificationPreferences prefs = user.getNotificationPreferences();
            if (prefs != null && !isAllowed(prefs, type)) {
                return null;  // suppressed by user preference
            }
        }

        Notification notification = Notification.builder()
                .userId(userId)
                .message(message)
                .type(type)
                .entityId(entityId)
                .read(false)
                .build();
        return notificationRepository.save(notification);
    }

    private boolean isAllowed(User.NotificationPreferences prefs,
                               Notification.NotificationType type) {
        return switch (type) {
            case BOOKING_APPROVED, BOOKING_REJECTED,
                 BOOKING_PENDING, BOOKING_CANCELLED -> prefs.isBookingUpdates();
            case TICKET_UPDATED                     -> prefs.isTicketUpdates();
            case NEW_COMMENT                        -> prefs.isCommentUpdates();
        };
    }
}