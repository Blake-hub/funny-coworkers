package com.example.pmis.controller;

import com.example.pmis.dto.CreateWikiFolderRequest;
import com.example.pmis.dto.UpdateWikiFolderRequest;
import com.example.pmis.dto.WikiFolderDTO;
import com.example.pmis.entity.User;
import com.example.pmis.service.WikiFolderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wiki/folders")
@RequiredArgsConstructor
@Tag(name = "Wiki Folders")
public class WikiFolderController {

    private final WikiFolderService wikiFolderService;

    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        }
        return null;
    }

    @GetMapping
    @Operation(summary = "Get all wiki folders as a tree")
    public ResponseEntity<List<WikiFolderDTO>> getFolderTree() {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(wikiFolderService.getAllFoldersTree(currentUser));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a wiki folder by ID")
    public ResponseEntity<WikiFolderDTO> getFolder(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(wikiFolderService.getFolderById(id, currentUser));
    }

    @PostMapping
    @Operation(summary = "Create a new wiki folder")
    public ResponseEntity<WikiFolderDTO> createFolder(@Valid @RequestBody CreateWikiFolderRequest req) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        WikiFolderDTO created = wikiFolderService.createFolder(req, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a wiki folder")
    public ResponseEntity<WikiFolderDTO> updateFolder(
            @PathVariable Long id,
            @Valid @RequestBody UpdateWikiFolderRequest req) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(wikiFolderService.updateFolder(id, req, currentUser));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a wiki folder")
    public ResponseEntity<Void> deleteFolder(@PathVariable Long id) {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        wikiFolderService.deleteFolder(id, currentUser);
        return ResponseEntity.noContent().build();
    }
}
