package com.example.pmis.controller;

import com.example.pmis.dto.CreateLabelRequest;
import com.example.pmis.dto.LabelDTO;
import com.example.pmis.service.LabelService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/labels")
@RequiredArgsConstructor
@Tag(name = "Labels", description = "Label management APIs")
public class LabelController {

    private final LabelService labelService;

    @GetMapping
    @Operation(summary = "Get all labels")
    public ResponseEntity<List<LabelDTO>> getAllLabels() {
        return ResponseEntity.ok(labelService.getAllLabels());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get label by ID")
    public ResponseEntity<LabelDTO> getLabelById(@PathVariable Long id) {
        return ResponseEntity.ok(labelService.getLabelById(id));
    }

    @PostMapping
    @Operation(summary = "Create a new label")
    public ResponseEntity<LabelDTO> createLabel(@Valid @RequestBody CreateLabelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(labelService.createLabel(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a label")
    public ResponseEntity<LabelDTO> updateLabel(@PathVariable Long id, @Valid @RequestBody CreateLabelRequest request) {
        return ResponseEntity.ok(labelService.updateLabel(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a label")
    public ResponseEntity<Void> deleteLabel(@PathVariable Long id) {
        labelService.deleteLabel(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{labelId}/projects/{projectId}")
    @Operation(summary = "Assign label to project")
    public ResponseEntity<Void> assignLabelToProject(@PathVariable Long projectId, @PathVariable Long labelId) {
        labelService.assignLabelToProject(projectId, labelId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{labelId}/projects/{projectId}")
    @Operation(summary = "Remove label from project")
    public ResponseEntity<Void> removeLabelFromProject(@PathVariable Long projectId, @PathVariable Long labelId) {
        labelService.removeLabelFromProject(projectId, labelId);
        return ResponseEntity.noContent().build();
    }
}