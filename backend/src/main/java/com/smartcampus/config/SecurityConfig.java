package com.smartcampus.config;

import com.smartcampus.security.JwtFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
// ── REMOVED @EnableMethodSecurity — was interfering with manual role checks ──
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s ->
                s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                // Static uploads (ticket images)
                .requestMatchers("/uploads/**").permitAll()

                // Resources — read is public, write is admin only (handled by @PreAuthorize)
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/resources/**").permitAll()
                
                .requestMatchers("/api/analytics/**").hasRole("ADMIN")
                .requestMatchers("/api/users").hasRole("ADMIN")
                .requestMatchers("/api/users/*/role").hasRole("ADMIN")

                // Resources — GET is public, everything else authenticated
                .requestMatchers(HttpMethod.GET,    "/api/resources/**").permitAll()
                .requestMatchers(HttpMethod.POST,   "/api/resources/**").authenticated()
                .requestMatchers(HttpMethod.PUT,    "/api/resources/**").authenticated()
                .requestMatchers(HttpMethod.PATCH,  "/api/resources/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/resources/**").authenticated()
                
                // QR verification — public, no login needed
                .requestMatchers(org.springframework.http.HttpMethod.GET,
                    "/api/bookings/verify/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.PATCH,
                    "/api/bookings/*/checkin").permitAll()

                // Bookings — all methods explicitly allowed for authenticated users
                // role checks are handled manually inside BookingController
                .requestMatchers(HttpMethod.GET,    "/api/bookings/**").authenticated()
                .requestMatchers(HttpMethod.POST,   "/api/bookings/**").authenticated()
                .requestMatchers(HttpMethod.PATCH,  "/api/bookings/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/api/bookings/**").authenticated()

                // Users
                .requestMatchers("/api/users/**").authenticated()

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter,
                UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));

        // ── PATCH and PUT added — was missing, caused 403 on approve/reject ──
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}