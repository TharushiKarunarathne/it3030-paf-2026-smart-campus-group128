package com.smartcampus.service;

import com.smartcampus.model.Booking;
import com.smartcampus.model.Ticket;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.TicketRepository;
import com.smartcampus.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final BookingRepository bookingRepository;
    private final TicketRepository  ticketRepository;
    private final UserRepository    userRepository;

    public AnalyticsService(BookingRepository bookingRepository,
                            TicketRepository ticketRepository,
                            UserRepository userRepository) {
        this.bookingRepository = bookingRepository;
        this.ticketRepository  = ticketRepository;
        this.userRepository    = userRepository;
    }

    public Map<String, Object> getDashboardAnalytics() {
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);

        // ── Bookings (last 7 days) ─────────────────────────────────────────────
        List<Booking> recentBookings = bookingRepository.findByCreatedAtAfter(sevenDaysAgo);
        long totalBookings    = recentBookings.size();
        long approvedBookings = recentBookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.APPROVED
                          || b.getStatus() == Booking.BookingStatus.CHECKED_IN)
                .count();

        // ── Tickets (current snapshot) ─────────────────────────────────────────
        long openTickets     = ticketRepository.countByStatus(Ticket.Status.OPEN)
                             + ticketRepository.countByStatus(Ticket.Status.IN_PROGRESS);
        long resolvedTickets = ticketRepository.countByStatus(Ticket.Status.RESOLVED);

        // ── Total users ────────────────────────────────────────────────────────
        long totalUsers = userRepository.count();

        // ── Top 3 most booked resources (last 7 days) ─────────────────────────
        Map<String, Long> resourceCounts = recentBookings.stream()
                .collect(Collectors.groupingBy(Booking::getResourceId, Collectors.counting()));

        List<Map<String, Object>> topResources = resourceCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .map(e -> {
                    String rid   = e.getKey();
                    String rName = recentBookings.stream()
                            .filter(b -> rid.equals(b.getResourceId()))
                            .findFirst()
                            .map(Booking::getResourceName)
                            .orElse("Unknown");
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("resourceId",   rid);
                    m.put("resourceName", rName);
                    m.put("count",        e.getValue());
                    return m;
                })
                .collect(Collectors.toList());

        // ── Peak booking hours (last 7 days, by startTime hour) ───────────────
        Map<Integer, Long> hourCounts = recentBookings.stream()
                .filter(b -> b.getStartTime() != null)
                .collect(Collectors.groupingBy(
                        b -> b.getStartTime().getHour(),
                        Collectors.counting()));

        List<Map<String, Object>> peakHours = hourCounts.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("hour",  e.getKey());
                    m.put("count", e.getValue());
                    return m;
                })
                .collect(Collectors.toList());

        // ── Assemble result ────────────────────────────────────────────────────
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalUsers",       totalUsers);
        result.put("totalBookings",    totalBookings);
        result.put("approvedBookings", approvedBookings);
        result.put("openTickets",      openTickets);
        result.put("resolvedTickets",  resolvedTickets);
        result.put("topResources",     topResources);
        result.put("peakHours",        peakHours);
        return result;
    }
}
