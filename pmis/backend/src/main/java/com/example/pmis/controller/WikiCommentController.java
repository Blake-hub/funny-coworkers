package com.example.pmis.controller;

import com.example.pmis.dto.CreateWikiCommentRequest;
import com.example.pmis.dto.WikiCommentDTO;
import com.example.pmis.service.WikiCommentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wiki/comments")
@RequiredArgsConstructor
@Tag(name = "Wiki Comments", description = "API endpoints for managing wiki page comments")
public class WikiCommentController {

    private final WikiCommentService wikiCommentService;

    @GetMapping("/page/{wikiPageId}")
    @Operation(summary = "Get all comments for a wiki page")
    public ResponseEntity<List<WikiCommentDTO>> getCommentsByWikiPageId(
            @PathVariable Long wikiPageId) {
        List<WikiCommentDTO> comments = wikiCommentService.getCommentsByWikiPageId(wikiPageId);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/page/{wikiPageId}/count")
    @Operation(summary = "Get comment count for a wiki page")
    public ResponseEntity<Long> getCommentCount(@PathVariable Long wikiPageId) {
        int count = wikiCommentService.getCommentCount(wikiPageId);
        return ResponseEntity.ok((long) count);
    }

    @PostMapping
    @Operation(summary = "Create a new comment")
    public ResponseEntity<WikiCommentDTO> createComment(
            @Valid @RequestBody CreateWikiCommentRequest request,
            @RequestParam Long userId) {
        WikiCommentDTO created = wikiCommentService.createComment(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a comment")
    public ResponseEntity<Void> deleteComment(@PathVariable Long id) {
        wikiCommentService.deleteComment(id);
        return ResponseEntity.noContent().build();
    }
}