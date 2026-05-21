package com.example.pmis.controller;

import com.example.pmis.dto.IssueStatusDefinitionDTO;
import com.example.pmis.service.IssueStatusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/issue-statuses")
@RequiredArgsConstructor
@Tag(name = "Issue Statuses", description = "Issue Status Definition APIs")
public class IssueStatusController {

    private final IssueStatusService issueStatusService;

    @GetMapping
    @Operation(summary = "Get all issue status definitions")
    public ResponseEntity<List<IssueStatusDefinitionDTO>> getAllStatusDefinitions() {
        return ResponseEntity.ok(issueStatusService.getAllStatusDefinitions());
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active issue status definitions")
    public ResponseEntity<List<IssueStatusDefinitionDTO>> getActiveStatusDefinitions() {
        return ResponseEntity.ok(issueStatusService.getActiveStatusDefinitions());
    }

    @PostMapping
    @Operation(summary = "Create a new issue status")
    public ResponseEntity<IssueStatusDefinitionDTO> createStatus(@RequestBody IssueStatusDefinitionDTO dto) {
        return ResponseEntity.ok(issueStatusService.createStatus(dto));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an issue status")
    public ResponseEntity<IssueStatusDefinitionDTO> updateStatus(
            @PathVariable Long id,
            @RequestBody IssueStatusDefinitionDTO dto) {
        return ResponseEntity.ok(issueStatusService.updateStatus(id, dto));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an issue status")
    public ResponseEntity<Void> deleteStatus(@PathVariable Long id) {
        issueStatusService.deleteStatus(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/order")
    @Operation(summary = "Reorder issue statuses")
    public ResponseEntity<Void> reorderStatuses(@RequestBody Map<String, List<Long>> request) {
        List<Long> statusIds = request.get("statusIds");
        issueStatusService.reorderStatuses(statusIds);
        return ResponseEntity.ok().build();
    }
}