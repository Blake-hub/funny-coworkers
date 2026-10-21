package com.blake.pmis.patent.controller;

import com.blake.pmis.entity.User;
import com.blake.pmis.patent.dto.PatentAdminDTO;
import com.blake.pmis.patent.service.PatentAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patent-admins")
@RequiredArgsConstructor
@Tag(name = "Patent Admins", description = "Module-level patent admin grants (global ADMIN only)")
public class PatentAdminController {

    private final PatentAdminService patentAdminService;

    private User getCurrentUser() {
        final Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal instanceof User user ? user : null;
    }

    @GetMapping
    @Operation(summary = "List patent admin grants")
    public ResponseEntity<List<PatentAdminDTO>> list() {
        return ResponseEntity.ok(patentAdminService.list());
    }

    @PostMapping
    @Operation(summary = "Grant patent admin to a user")
    public ResponseEntity<?> grant(@RequestBody Map<String, Long> body) {
        final User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        final Long userId = body != null ? body.get("userId") : null;
        return ResponseEntity.ok(patentAdminService.grant(userId, user));
    }

    @DeleteMapping("/{userId}")
    @Operation(summary = "Revoke patent admin from a user")
    public ResponseEntity<Map<String, Object>> revoke(@PathVariable Long userId) {
        final User user = getCurrentUser();
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        patentAdminService.revoke(userId, user);
        return ResponseEntity.ok(Map.of("ok", true));
    }
}
