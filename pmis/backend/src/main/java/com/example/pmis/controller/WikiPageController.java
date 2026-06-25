package com.example.pmis.controller;

import com.example.pmis.dto.CreateWikiPageRequest;
import com.example.pmis.dto.UpdateWikiPageRequest;
import com.example.pmis.dto.WikiPageDTO;
import com.example.pmis.service.WikiPageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wiki/pages")
@RequiredArgsConstructor
@Tag(name = "Wiki Pages", description = "Wiki page management APIs")
public class WikiPageController {

    private final WikiPageService wikiPageService;

    @GetMapping
    @Operation(summary = "Get all wiki pages")
    public ResponseEntity<List<WikiPageDTO>> getAllWikiPages() {
        return ResponseEntity.ok(wikiPageService.getAllWikiPages());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a wiki page by ID (returns JSON for editing)")
    public ResponseEntity<WikiPageDTO> getWikiPageById(@PathVariable Long id) {
        return ResponseEntity.ok(wikiPageService.getWikiPageById(id));
    }

    @GetMapping("/{id}/html")
    @Operation(summary = "Get wiki page HTML content for display view")
    public ResponseEntity<Map<String, String>> getWikiPageHtml(@PathVariable Long id) {
        String html = wikiPageService.getWikiPageHtml(id);
        return ResponseEntity.ok(Map.of("contentHtml", html));
    }

    @PostMapping
    @Operation(summary = "Create a new wiki page")
    public ResponseEntity<WikiPageDTO> createWikiPage(
            @Valid @RequestBody CreateWikiPageRequest request,
            @RequestParam Long userId) {
        WikiPageDTO created = wikiPageService.createWikiPage(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a wiki page (save draft)")
    public ResponseEntity<WikiPageDTO> updateWikiPage(
            @PathVariable Long id,
            @Valid @RequestBody UpdateWikiPageRequest request,
            @RequestParam Long userId) {
        return ResponseEntity.ok(wikiPageService.updateWikiPage(id, request, userId));
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publish a wiki page")
    public ResponseEntity<WikiPageDTO> publishWikiPage(
            @PathVariable Long id,
            @RequestParam Long userId) {
        return ResponseEntity.ok(wikiPageService.publishWikiPage(id, userId));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a wiki page")
    public ResponseEntity<Void> deleteWikiPage(@PathVariable Long id) {
        wikiPageService.deleteWikiPage(id);
        return ResponseEntity.noContent().build();
    }
}
