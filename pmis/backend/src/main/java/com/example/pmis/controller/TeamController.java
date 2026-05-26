package com.example.pmis.controller;

import com.example.pmis.dto.TeamDTO;
import com.example.pmis.dto.UserDTO;
import com.example.pmis.entity.enumeration.Role;
import com.example.pmis.service.TeamService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    @GetMapping("/{id}/members")
    @Operation(summary = "Get team members")
    public ResponseEntity<List<UserDTO>> getTeamMembers(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeamMembers(id));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Get teams for a user")
    public ResponseEntity<List<TeamDTO>> getTeamsForUser(@PathVariable Long userId) {
        return ResponseEntity.ok(teamService.getTeamsForUser(userId));
    }

    @GetMapping("/{teamId}/user/{userId}/role")
    @Operation(summary = "Get user role in team")
    public ResponseEntity<Role> getUserRoleInTeam(@PathVariable Long teamId, @PathVariable Long userId) {
        Role role = teamService.getUserRoleInTeam(teamId, userId);
        if (role == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(role);
    }

    @PostMapping("/{id}/members")
    @Operation(summary = "Add a team member")
    public ResponseEntity<Void> addTeamMember(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Long userId = ((Number) request.get("userId")).longValue();
        String roleStr = (String) request.get("role");
        Role role = Role.valueOf(roleStr.toUpperCase());
        teamService.addTeamMember(id, userId, role);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{teamId}/members/{userId}")
    @Operation(summary = "Remove a team member")
    public ResponseEntity<Void> removeTeamMember(@PathVariable Long teamId, @PathVariable Long userId) {
        teamService.removeTeamMember(teamId, userId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{teamId}/members/{userId}/role")
    @Operation(summary = "Update team member role")
    public ResponseEntity<Void> updateTeamMemberRole(@PathVariable Long teamId, @PathVariable Long userId, @RequestBody Map<String, String> request) {
        Role role = Role.valueOf(request.get("role").toUpperCase());
        teamService.updateTeamMemberRole(teamId, userId, role);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{teamId}/owner")
    @Operation(summary = "Transfer team ownership")
    public ResponseEntity<TeamDTO> transferOwnership(@PathVariable Long teamId, @RequestBody Map<String, Long> request) {
        Long newOwnerId = request.get("newOwnerId");
        TeamDTO updatedTeam = teamService.transferOwnership(teamId, newOwnerId);
        return ResponseEntity.ok(updatedTeam);
    }
}