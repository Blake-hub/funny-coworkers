package com.retroboard.controller;

import com.retroboard.entity.Team;
import com.retroboard.service.TeamService;
import com.retroboard.dto.CreateTeamRequest;
import com.retroboard.dto.UpdateTeamRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/teams")
public class TeamController {
    
    @Autowired
    private TeamService teamService;
    
    // Create a new team
    @PostMapping
    public ResponseEntity<Team> createTeam(@RequestBody CreateTeamRequest request) {
        Team team = teamService.createTeam(request);
        return new ResponseEntity<>(team, HttpStatus.CREATED);
    }
    
    // Delete a team
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long id) {
        teamService.deleteTeam(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    // Query all teams
    @GetMapping
    public ResponseEntity<List<Team>> getAllTeams() {
        List<Team> teams = teamService.getAllTeams();
        return new ResponseEntity<>(teams, HttpStatus.OK);
    }
    
    // Update a team
    @PutMapping("/{id}")
    public ResponseEntity<Team> updateTeam(@PathVariable Long id, @RequestBody UpdateTeamRequest request) {
        Team updatedTeam = teamService.updateTeam(id, request);
        return new ResponseEntity<>(updatedTeam, HttpStatus.OK);
    }
    
    // Get a team by id
    @GetMapping("/{id}")
    public ResponseEntity<Team> getTeamById(@PathVariable Long id) {
        Team team = teamService.getTeamById(id);
        return new ResponseEntity<>(team, HttpStatus.OK);
    }
}
