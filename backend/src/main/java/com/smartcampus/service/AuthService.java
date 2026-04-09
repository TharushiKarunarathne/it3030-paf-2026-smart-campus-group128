package com.smartcampus.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.smartcampus.model.User;
import com.smartcampus.repository.UserRepository;
import com.smartcampus.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Service
public class AuthService {

    private final UserRepository  userRepository;
    private final JwtUtil         jwtUtil;
    private final PasswordEncoder passwordEncoder;

    @Value("${google.client-id}")
    private String googleClientId;

    public AuthService(UserRepository userRepository,
                       JwtUtil jwtUtil,
                       PasswordEncoder passwordEncoder) {
        this.userRepository  = userRepository;
        this.jwtUtil         = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

   // Google OAuth login
public Map<String, Object> loginWithGoogle(String credential) throws Exception {
    try {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        GoogleIdToken idToken = verifier.verify(credential);
        if (idToken == null) {
            throw new RuntimeException("Invalid Google token");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String googleId = payload.getSubject();
        String email    = payload.getEmail();
        String name     = (String) payload.get("name");
        String picture  = (String) payload.get("picture");

        User user = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(email))
                .orElse(null);

        if (user == null) {
            user = User.builder()
                    .googleId(googleId)
                    .email(email)
                    .name(name)
                    .picture(picture)
                    .role(User.Role.USER)
                    .build();
        } else {
            user.setName(name);
            user.setPicture(picture);
            user.setGoogleId(googleId);
        }

        user = userRepository.save(user);
        return buildAuthResponse(user);

    } catch (RuntimeException e) {
        throw e;
    } catch (Exception e) {
        throw new RuntimeException("Google login failed: " + e.getMessage());
    }
}

    // Username & password login
    public Map<String, Object> loginWithPassword(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (user.getPassword() == null ||
                !passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        if (!user.isEnabled()) {
            throw new RuntimeException("Account is disabled");
        }

        return buildAuthResponse(user);
    }

    // Register with email & password
    public Map<String, Object> register(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("Email already in use");
        }

        User user = User.builder()
                .name(name)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(User.Role.USER)
                .build();

        user = userRepository.save(user);
        return buildAuthResponse(user);
    }

    // Build response with token + user info
    private Map<String, Object> buildAuthResponse(User user) {
        String token = jwtUtil.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );

        // Resolve preferences — fall back to safe defaults if null (existing users)
        User.NotificationPreferences prefs = user.getNotificationPreferences();
        if (prefs == null) {
            prefs = new User.NotificationPreferences();
        }
        Map<String, Object> prefsMap = new HashMap<>();
        prefsMap.put("bookingUpdates", prefs.isBookingUpdates());
        prefsMap.put("ticketUpdates",  prefs.isTicketUpdates());
        prefsMap.put("commentUpdates", prefs.isCommentUpdates());

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id",                      user.getId());
        userMap.put("name",                    user.getName());
        userMap.put("email",                   user.getEmail());
        userMap.put("role",                    user.getRole().name());
        userMap.put("picture",                 user.getPicture());
        userMap.put("notificationPreferences", prefsMap);

        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("user",  userMap);

        return response;
    }
}