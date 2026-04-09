package com.smartcampus.service;

import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class UserService {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Get all users
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    // Get user by ID
    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Update profile (works for both own profile and admin editing others)
    public User updateProfile(String userId, Map<String, String> body) {
        User user = getUserById(userId);

        if (body.containsKey("name") && !body.get("name").isBlank()) {
            user.setName(body.get("name"));
        }
        if (body.containsKey("email") && !body.get("email").isBlank()) {
            // Check email not taken by another user
            userRepository.findByEmail(body.get("email")).ifPresent(existing -> {
                if (!existing.getId().equals(userId)) {
                    throw new RuntimeException("Email already in use");
                }
            });
            user.setEmail(body.get("email"));
        }
        if (body.containsKey("password") && !body.get("password").isBlank()) {
            user.setPassword(passwordEncoder.encode(body.get("password")));
        }
        if (body.containsKey("picture")) {
            user.setPicture(body.get("picture"));
        }

        return userRepository.save(user);
    }

    // Admin creates a new user
    public User createUser(String name, String email,
                           String password, String role) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already in use");
        }

        User.Role userRole = User.Role.USER;
        if (role != null) {
            try {
                userRole = User.Role.valueOf(role);
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid role: " + role);
            }
        }

        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(userRole)
                .enabled(true)
                .build();

        return userRepository.save(user);
    }

    // Update role
    public User updateRole(String userId, String role) {
        User user = getUserById(userId);
        try {
            user.setRole(User.Role.valueOf(role));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role: " + role);
        }
        return userRepository.save(user);
    }

    // Update notification preferences
    public User updatePreferences(String userId, User.NotificationPreferences preferences) {
        User user = getUserById(userId);
        if (preferences == null) {
            preferences = new User.NotificationPreferences();
        }
        user.setNotificationPreferences(preferences);
        return userRepository.save(user);
    }

    // Delete user
    public void deleteUser(String userId) {
        User user = getUserById(userId);
        userRepository.delete(user);
    }
}