package com.example.pmis.controller;

import com.example.pmis.dto.NotificationDTO;
import com.example.pmis.entity.User;
import com.example.pmis.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications")
public class NotificationController {

    private final NotificationService notificationService;

    private User getCurrentUser() {
        final Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        }
        return null;
    }

    private static ResponseEntity<Map<String, Object>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    @GetMapping
    @Operation(summary = "List notifications for the current user (newest first)")
    public ResponseEntity<Map<String, Object>> listNotifications(
            @RequestParam(name = "limit", defaultValue = "30") int limit) {
        final User currentUser = getCurrentUser();
        if (currentUser == null) return unauthorized();
        final List<NotificationDTO> items = notificationService.listDtosForUser(currentUser, limit);
        final long unread = notificationService.getUnreadCount(currentUser);
        final Map<String, Object> body = new HashMap<>();
        body.put("items", items);
        body.put("unreadCount", unread);
        return ResponseEntity.ok(body);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Lightweight count of unread notifications for polling")
    public ResponseEntity<Map<String, Object>> unreadCount() {
        final User currentUser = getCurrentUser();
        if (currentUser == null) return unauthorized();
        return ResponseEntity.ok(Map.of("unreadCount", notificationService.getUnreadCount(currentUser)));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark a single notification as read (by id — user must own notification)")
    public ResponseEntity<Map<String, Object>> markRead(@PathVariable Long id) {
        final User currentUser = getCurrentUser();
        if (currentUser == null) return unauthorized();
        try {
            notificationService.markRead(id, currentUser);
        } catch (EntityNotFoundException notFound) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "not found", "status", 404));
        }
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PatchMapping("/mark-all-read")
    @Operation(summary = "Mark ALL notifications for the current user as read in one batch update")
    public ResponseEntity<Map<String, Object>> markAllRead() {
        final User currentUser = getCurrentUser();
        if (currentUser == null) return unauthorized();
        final int updated = notificationService.markAllRead(currentUser);
        final Map<String, Object> body = new HashMap<>();
        body.put("ok", true);
        body.put("updatedCount", updated);
        return ResponseEntity.ok(body);
    }
}
