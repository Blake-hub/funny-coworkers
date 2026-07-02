package com.example.pmis.controller;

import com.example.pmis.dto.CreateWikiPageRequest;
import com.example.pmis.dto.UpdateWikiPageRequest;
import com.example.pmis.dto.WikiPageDTO;
import com.example.pmis.entity.User;
import com.example.pmis.service.WikiPageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/wiki/pages")
@RequiredArgsConstructor
@Tag(name = "Wiki Pages", description = "Wiki page management APIs")
public class WikiPageController {

    private final WikiPageService wikiPageService;

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        }
        return null;
    }

    @GetMapping
    @Operation(summary = "Get all wiki pages")
    public ResponseEntity<List<WikiPageDTO>> getAllWikiPages(
            @RequestParam(required = false) Optional<Long> folderId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(wikiPageService.getAllWikiPages(folderId, currentUser));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a wiki page by ID (returns JSON for editing)")
    public ResponseEntity<WikiPageDTO> getWikiPageById(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(wikiPageService.getWikiPageById(id, currentUser));
    }

    @GetMapping("/{id}/html")
    @Operation(summary = "Get wiki page HTML content for display view")
    public ResponseEntity<Map<String, String>> getWikiPageHtml(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String html = wikiPageService.getWikiPageHtml(id, currentUser);
        return ResponseEntity.ok(Map.of("contentHtml", html));
    }

    @PostMapping
    @Operation(summary = "Create a new wiki page")
    public ResponseEntity<WikiPageDTO> createWikiPage(
            @Valid @RequestBody CreateWikiPageRequest request) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        WikiPageDTO created = wikiPageService.createWikiPage(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a wiki page (save draft)")
    public ResponseEntity<WikiPageDTO> updateWikiPage(
            @PathVariable Long id,
            @Valid @RequestBody UpdateWikiPageRequest request) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(wikiPageService.updateWikiPage(id, request, currentUser));
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publish a wiki page")
    public ResponseEntity<WikiPageDTO> publishWikiPage(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(wikiPageService.publishWikiPage(id, currentUser));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a wiki page")
    public ResponseEntity<Void> deleteWikiPage(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        wikiPageService.deleteWikiPage(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
