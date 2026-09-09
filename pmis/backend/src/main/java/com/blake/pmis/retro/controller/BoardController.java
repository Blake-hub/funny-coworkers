package com.blake.pmis.retro.controller;

import com.blake.pmis.entity.User;
import com.blake.pmis.retro.dto.*;
import com.blake.pmis.retro.service.BoardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/retro/boards")
@RequiredArgsConstructor
@Tag(name = "Retro Boards", description = "Retrospective board management APIs")
public class BoardController {

    private final BoardService boardService;

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        }
        return null;
    }

    @PostMapping
    @Operation(summary = "Create a new retrospective board")
    public ResponseEntity<BoardDTO> createBoard(@RequestBody CreateBoardRequest req) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(boardService.createBoard(req, currentUser));
    }

    @GetMapping
    @Operation(summary = "List boards by view (owned/joined/all)")
    public ResponseEntity<List<BoardDTO>> listBoards(
            @RequestParam(defaultValue = "joined") String view) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(boardService.listBoards(view, currentUser));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a board by ID")
    public ResponseEntity<BoardDTO> getBoardById(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(boardService.getBoardById(id, currentUser));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a board (owner only)")
    public ResponseEntity<BoardDTO> updateBoard(@PathVariable Long id, @RequestBody UpdateBoardRequest req) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(boardService.updateBoard(id, req, currentUser));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a board (owner only)")
    public ResponseEntity<Void> deleteBoard(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        boardService.deleteBoard(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/end")
    @Operation(summary = "End a retrospective (owner only, makes board read-only)")
    public ResponseEntity<Void> endBoard(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        boardService.endBoard(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/participants")
    @Operation(summary = "Invite participants (owner only)")
    public ResponseEntity<Void> inviteParticipants(@PathVariable Long id, @RequestBody InviteRequest req) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        boardService.inviteParticipants(id, req, currentUser);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/participants/{userId}")
    @Operation(summary = "Remove a participant (owner only)")
    public ResponseEntity<Void> removeParticipant(@PathVariable Long id, @PathVariable Long userId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        boardService.removeParticipant(id, userId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
