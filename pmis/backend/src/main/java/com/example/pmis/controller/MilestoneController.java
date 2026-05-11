package com.example.pmis.controller;

import com.example.pmis.dto.CreateMilestoneRequest;
import com.example.pmis.dto.MilestoneDTO;
import com.example.pmis.service.MilestoneService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/milestones")
@RequiredArgsConstructor
@Tag(name = "Milestones", description = "Milestone management APIs")
public class MilestoneController {

    private final MilestoneService milestoneService;

    @GetMapping
    @Operation(summary = "Get all milestones for a project")
    public ResponseEntity<List<MilestoneDTO>> getMilestones(@PathVariable Long projectId) {
        return ResponseEntity.ok(milestoneService.getMilestonesByProject(projectId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get milestone by ID")
    public ResponseEntity<MilestoneDTO> getMilestoneById(@PathVariable Long projectId, @PathVariable Long id) {
        return ResponseEntity.ok(milestoneService.getMilestoneById(projectId, id));
    }

    @PostMapping
    @Operation(summary = "Create a new milestone")
    public ResponseEntity<MilestoneDTO> createMilestone(@PathVariable Long projectId, @Valid @RequestBody CreateMilestoneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(milestoneService.createMilestone(projectId, request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a milestone")
    public ResponseEntity<MilestoneDTO> updateMilestone(@PathVariable Long projectId, @PathVariable Long id, @Valid @RequestBody CreateMilestoneRequest request) {
        return ResponseEntity.ok(milestoneService.updateMilestone(projectId, id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a milestone")
    public ResponseEntity<Void> deleteMilestone(@PathVariable Long projectId, @PathVariable Long id) {
        milestoneService.deleteMilestone(projectId, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/complete")
    @Operation(summary = "Mark milestone as complete")
    public ResponseEntity<MilestoneDTO> completeMilestone(@PathVariable Long projectId, @PathVariable Long id) {
        return ResponseEntity.ok(milestoneService.completeMilestone(projectId, id));
    }
}