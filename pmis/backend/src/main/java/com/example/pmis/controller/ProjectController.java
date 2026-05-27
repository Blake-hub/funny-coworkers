package com.example.pmis.controller;

import com.example.pmis.dto.CreateProjectRequest;
import com.example.pmis.dto.ProjectDTO;
import com.example.pmis.dto.UpdateProjectRequest;
import com.example.pmis.service.LabelService;
import com.example.pmis.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@Tag(name = "Projects", description = "Project management APIs")
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    @Operation(summary = "Get all projects")
    public ResponseEntity<List<ProjectDTO>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get projects for a user based on their team membership")
    public ResponseEntity<List<ProjectDTO>> getProjectsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(projectService.getProjectsForUser(userId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID")
    public ResponseEntity<ProjectDTO> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @GetMapping("/leader/{leaderId}")
    @Operation(summary = "Get projects by leader")
    public ResponseEntity<List<ProjectDTO>> getProjectsByLeader(@PathVariable Long leaderId) {
        return ResponseEntity.ok(projectService.getProjectsByLeader(leaderId));
    }

    @PostMapping
    @Operation(summary = "Create a new project")
    public ResponseEntity<ProjectDTO> createProject(@Valid @RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a project")
    public ResponseEntity<ProjectDTO> updateProject(@PathVariable Long id, @Valid @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a project")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/members")
    @Operation(summary = "Add member to project")
    public ResponseEntity<Void> addMember(@PathVariable Long id, @RequestParam Long userId) {
        projectService.addMember(id, userId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/members/{userId}")
    @Operation(summary = "Remove member from project")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        projectService.removeMember(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/labels/{labelId}")
    @Operation(summary = "Assign label to project")
    public ResponseEntity<Void> assignLabel(@PathVariable Long id, @PathVariable Long labelId) {
        projectService.assignLabel(id, labelId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/labels/{labelId}")
    @Operation(summary = "Remove label from project")
    public ResponseEntity<Void> removeLabel(@PathVariable Long id, @PathVariable Long labelId) {
        projectService.removeLabel(id, labelId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/labels")
    @Operation(summary = "Update project labels")
    public ResponseEntity<Void> updateLabels(@PathVariable Long id, @RequestBody java.util.Map<String, List<Long>> request) {
        List<Long> labelIds = request.get("labelIds");
        projectService.updateLabels(id, labelIds);
        return ResponseEntity.ok().build();
    }
}