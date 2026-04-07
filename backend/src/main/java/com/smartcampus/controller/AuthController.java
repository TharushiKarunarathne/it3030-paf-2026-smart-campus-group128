package com.smartcampus.controller;

import com.smartcampus.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/google
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> body) {
        try {
            String credential = body.get("credential");
            if (credential == null || credential.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Google credential is required"));
            }
            Map<String, Object> response = authService.loginWithGoogle(credential);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Google login failed: " + e.getMessage()));
        }
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<?> passwordLogin(@RequestBody Map<String, String> body) {
        try {
            String email    = body.get("email");
            String password = body.get("password");

            if (email == null || password == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Email and password are required"));
            }

            Map<String, Object> response = authService.loginWithPassword(email, password);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> body) {
        try {
            String name     = body.get("name");
            String email    = body.get("email");
            String password = body.get("password");

            if (name == null || email == null || password == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Name, email and password are required"));
            }

            Map<String, Object> response = authService.register(name, email, password);
            return ResponseEntity.status(201).body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        }
    }
}