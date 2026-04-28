package com.example.pmis.controller;

import com.example.pmis.dto.TeamDTO;
import com.example.pmis.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
@Tag(name = "Teams", description = "Team management APIs")
public class TeamController {

    private final TeamService teamService;

    @GetMapping
    @Operation(summary = "Get all teams")
    public ResponseEntity<List<TeamDTO>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get team by ID")
    public ResponseEntity<TeamDTO> getTeamById(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeamById(id));
    }

    @GetMapping("/identifier/{identifier}")
    @Operation(summary = "Get team by identifier")
    public ResponseEntity<TeamDTO> getTeamByIdentifier(@PathVariable String identifier) {
        return ResponseEntity.ok(teamService.getTeamByIdentifier(identifier));
    }

    @PostMapping
    @Operation(summary = "Create a new team")
    public ResponseEntity<TeamDTO> createTeam(@Valid @RequestBody TeamDTO teamDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teamService.createTeam(teamDTO));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a team")
    public ResponseEntity<TeamDTO> updateTeam(@PathVariable Long id, @Valid @RequestBody TeamDTO teamDTO) {
        return ResponseEntity.ok(teamService.updateTeam(id, teamDTO));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a team")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long id) {
        teamService.deleteTeam(id);
        return ResponseEntity.noContent().build();
    }
}