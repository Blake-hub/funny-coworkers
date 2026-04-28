package com.example.pmis.controller;

import com.example.pmis.dto.ProjectDTO;
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
    public ResponseEntity<ProjectDTO> createProject(@Valid @RequestBody ProjectDTO projectDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(projectDTO));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a project")
    public ResponseEntity<ProjectDTO> updateProject(@PathVariable Long id, @Valid @RequestBody ProjectDTO projectDTO) {
        return ResponseEntity.ok(projectService.updateProject(id, projectDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a project")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }
}