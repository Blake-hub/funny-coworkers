package com.blake.pmis.retro.controller;

import com.blake.pmis.entity.User;
import com.blake.pmis.retro.dto.CardDTO;
import com.blake.pmis.retro.dto.CreateCardRequest;
import com.blake.pmis.retro.dto.UpdateCardRequest;
import com.blake.pmis.retro.service.CardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/retro/cards")
@RequiredArgsConstructor
@Tag(name = "Retro Cards", description = "Retrospective card management APIs")
public class CardController {

    private final CardService cardService;

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        }
        return null;
    }

    @PostMapping
    @Operation(summary = "Create a new card")
    public ResponseEntity<CardDTO> createCard(@RequestBody CreateCardRequest req) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(cardService.createCard(req, currentUser));
    }

    @GetMapping
    @Operation(summary = "Get cards by column ID")
    public ResponseEntity<List<CardDTO>> getCardsByColumn(@RequestParam Long columnId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(cardService.getCardsByColumn(columnId, currentUser));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a card (title/description/move column/position)")
    public ResponseEntity<CardDTO> updateCard(@PathVariable Long id, @RequestBody UpdateCardRequest req) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(cardService.updateCard(id, req, currentUser));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a card")
    public ResponseEntity<Void> deleteCard(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        cardService.deleteCard(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/vote")
    @Operation(summary = "Toggle vote on a card")
    public ResponseEntity<CardDTO> voteCard(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(cardService.voteCard(id, currentUser));
    }
}
