package com.example.pmis.controller;

import com.example.pmis.dto.CreateIssueDTO;
import com.example.pmis.dto.IssueDTO;
import com.example.pmis.dto.UpdateIssueDTO;
import com.example.pmis.service.IssueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/issues")
@RequiredArgsConstructor
@Tag(name = "Issues", description = "Issue Management APIs")
public class IssueController {

    private final IssueService issueService;

    @GetMapping
    @Operation(summary = "Get all issues (optionally filtered by project)")
    public ResponseEntity<List<IssueDTO>> getIssues(@RequestParam(required = false) Long projectId) {
        return ResponseEntity.ok(issueService.getIssuesByProject(projectId));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a single issue by ID")
    public ResponseEntity<IssueDTO> getIssue(@PathVariable Long id) {
        return ResponseEntity.ok(issueService.getIssue(id));
    }

    @PostMapping
    @Operation(summary = "Create a new issue")
    public ResponseEntity<IssueDTO> createIssue(@RequestBody CreateIssueDTO dto) {
        return ResponseEntity.ok(issueService.createIssue(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an issue")
    public ResponseEntity<IssueDTO> updateIssue(
            @PathVariable Long id,
            @RequestBody UpdateIssueDTO dto) {
        return ResponseEntity.ok(issueService.updateIssue(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an issue")
    public ResponseEntity<Void> deleteIssue(@PathVariable Long id) {
        issueService.deleteIssue(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update issue status (for drag and drop)")
    public ResponseEntity<IssueDTO> updateIssueStatus(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request) {
        Integer statusId = (Integer) request.get("statusId");
        Integer sortOrder = request.get("sortOrder") != null
            ? ((Number) request.get("sortOrder")).intValue()
            : null;
        return ResponseEntity.ok(issueService.updateIssueStatus(id, statusId, sortOrder));
    }

    @PutMapping("/{id}/order")
    @Operation(summary = "Update issue sort order (for reordering within status)")
    public ResponseEntity<IssueDTO> updateIssueOrder(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> request) {
        Integer sortOrder = request.get("sortOrder");
        return ResponseEntity.ok(issueService.updateIssueSortOrder(id, sortOrder));
    }
}