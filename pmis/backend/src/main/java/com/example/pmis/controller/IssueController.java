package com.example.pmis.controller;

import com.example.pmis.dto.IssueDTO;
import com.example.pmis.service.IssueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
@Tag(name = "Issues", description = "Issue management APIs")
public class IssueController {

    private final IssueService issueService;

    @GetMapping
    @Operation(summary = "Get all issues")
    public ResponseEntity<List<IssueDTO>> getAllIssues() {
        return ResponseEntity.ok(issueService.getAllIssues());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get issue by ID")
    public ResponseEntity<IssueDTO> getIssueById(@PathVariable Long id) {
        return ResponseEntity.ok(issueService.getIssueById(id));
    }

    @GetMapping("/assignee/{assigneeId}")
    @Operation(summary = "Get issues by assignee")
    public ResponseEntity<List<IssueDTO>> getIssuesByAssignee(@PathVariable Long assigneeId) {
        return ResponseEntity.ok(issueService.getIssuesByAssignee(assigneeId));
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Get issues by project")
    public ResponseEntity<List<IssueDTO>> getIssuesByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(issueService.getIssuesByProject(projectId));
    }

    @PostMapping
    @Operation(summary = "Create a new issue")
    public ResponseEntity<IssueDTO> createIssue(@Valid @RequestBody IssueDTO issueDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(issueService.createIssue(issueDTO));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an issue")
    public ResponseEntity<IssueDTO> updateIssue(@PathVariable Long id, @Valid @RequestBody IssueDTO issueDTO) {
        return ResponseEntity.ok(issueService.updateIssue(id, issueDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an issue")
    public ResponseEntity<Void> deleteIssue(@PathVariable Long id) {
        issueService.deleteIssue(id);
        return ResponseEntity.noContent().build();
    }
}