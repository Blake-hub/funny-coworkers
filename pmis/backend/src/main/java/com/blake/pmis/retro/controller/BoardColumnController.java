package com.blake.pmis.retro.controller;

import com.blake.pmis.entity.User;
import com.blake.pmis.retro.dto.ColumnDTO;
import com.blake.pmis.retro.dto.CreateColumnRequest;
import com.blake.pmis.retro.dto.UpdateColumnRequest;
import com.blake.pmis.retro.service.BoardColumnService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/retro/columns")
@RequiredArgsConstructor
@Tag(name = "Retro Columns", description = "Retrospective column management APIs")
public class BoardColumnController {

    private final BoardColumnService boardColumnService;

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        }
        return null;
    }

    @PostMapping
    @Operation(summary = "Create a new column (owner only)")
    public ResponseEntity<ColumnDTO> createColumn(@RequestBody CreateColumnRequest req) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(boardColumnService.createColumn(req, currentUser));
    }

    @GetMapping
    @Operation(summary = "Get columns by board ID")
    public ResponseEntity<List<ColumnDTO>> getColumnsByBoard(@RequestParam Long boardId) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(boardColumnService.getColumnsByBoard(boardId, currentUser));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a column (owner only)")
    public ResponseEntity<ColumnDTO> updateColumn(@PathVariable Long id, @RequestBody UpdateColumnRequest req) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(boardColumnService.updateColumn(id, req, currentUser));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a column (owner only)")
    public ResponseEntity<Void> deleteColumn(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        boardColumnService.deleteColumn(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
