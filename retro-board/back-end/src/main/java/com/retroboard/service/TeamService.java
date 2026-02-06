package com.retroboard.service;

import com.retroboard.entity.Team;
import com.retroboard.entity.TeamMember;
import com.retroboard.entity.User;
import com.retroboard.repository.TeamRepository;
import com.retroboard.repository.TeamMemberRepository;
import com.retroboard.repository.UserRepository;
import com.retroboard.dto.CreateTeamRequest;
import com.retroboard.dto.UpdateTeamRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class TeamService {
    
    @Autowired
    private TeamRepository teamRepository;
    
    @Autowired
    private TeamMemberRepository teamMemberRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Get current authenticated user
    private User getCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
    
    // Check if user has access to the team (owner or member)
    private void checkTeamAccess(Long teamId) {
        User currentUser = getCurrentUser();
        if (!teamRepository.existsByTeamIdAndOwnerOrMember(teamId, currentUser)) {
            throw new RuntimeException("Access denied: You don't have permission to access this team");
        }
    }
    
    @Transactional
    public Team createTeam(CreateTeamRequest request) {
        // Get the owner user
        User owner = userRepository.findById(request.getOwnerId())
            .orElseThrow(() -> new RuntimeException("Owner not found"));
        
        // Create the team
        Team team = new Team();
        team.setName(request.getName());
        team.setOwner(owner);
        team = teamRepository.save(team);
        
        // Add the owner as a member with 'owner' role
        TeamMember ownerMember = new TeamMember();
        ownerMember.setTeam(team);
        ownerMember.setUser(owner);
        ownerMember.setRole("owner");
        teamMemberRepository.save(ownerMember);
        
        return team;
    }
    
    @Transactional
    public void deleteTeam(Long teamId) {
        // Check team access
        checkTeamAccess(teamId);
        
        // Check if team exists
        Team team = teamRepository.findById(teamId)
            .orElseThrow(() -> new RuntimeException("Team not found"));
        
        // Delete the team (cascades to team members due to foreign key constraint)
        teamRepository.delete(team);
    }
    
    public List<Team> getAllTeams() {
        User currentUser = getCurrentUser();
        return teamRepository.findByOwnerOrMember(currentUser);
    }
    
    @Transactional
    public Team updateTeam(Long teamId, UpdateTeamRequest request) {
        // Check team access
        checkTeamAccess(teamId);
        
        // Get the team
        Team team = teamRepository.findById(teamId)
            .orElseThrow(() -> new RuntimeException("Team not found"));
        
        // Update team name if provided
        if (request.getName() != null) {
            team.setName(request.getName());
        }
        
        // Update owner if provided
        if (request.getOwnerId() != null) {
            User newOwner = userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new RuntimeException("New owner not found"));
            team.setOwner(newOwner);
            
            // Update the role of the new owner to 'owner'
            Optional<TeamMember> newOwnerMember = teamMemberRepository.findByTeamAndUser(team, newOwner);
            if (newOwnerMember.isPresent()) {
                newOwnerMember.get().setRole("owner");
                teamMemberRepository.save(newOwnerMember.get());
            } else {
                // Add new owner as a member if not already
                TeamMember ownerMember = new TeamMember();
                ownerMember.setTeam(team);
                ownerMember.setUser(newOwner);
                ownerMember.setRole("owner");
                teamMemberRepository.save(ownerMember);
            }
        }
        
        // Update team members if provided
        if (request.getMembers() != null) {
            // Get current members
            List<TeamMember> currentMembers = teamMemberRepository.findByTeam(team);
            
            // Remove current members not in the new list
            for (TeamMember member : currentMembers) {
                boolean existsInNewList = request.getMembers().stream()
                    .anyMatch(m -> m.getUserId().equals(member.getUser().getId()));
                if (!existsInNewList) {
                    teamMemberRepository.delete(member);
                }
            }
            
            // Add or update members from the new list
            for (UpdateTeamRequest.TeamMemberRequest memberRequest : request.getMembers()) {
                User user = userRepository.findById(memberRequest.getUserId())
                    .orElseThrow(() -> new RuntimeException("User not found: " + memberRequest.getUserId()));
                
                Optional<TeamMember> existingMember = teamMemberRepository.findByTeamAndUser(team, user);
                if (existingMember.isPresent()) {
                    // Update role if provided
                    if (memberRequest.getRole() != null) {
                        existingMember.get().setRole(memberRequest.getRole());
                        teamMemberRepository.save(existingMember.get());
                    }
                } else {
                    // Add new member
                    TeamMember newMember = new TeamMember();
                    newMember.setTeam(team);
                    newMember.setUser(user);
                    newMember.setRole(memberRequest.getRole() != null ? memberRequest.getRole() : "member");
                    teamMemberRepository.save(newMember);
                }
            }
        }
        
        return teamRepository.save(team);
    }
    
    public Team getTeamById(Long teamId) {
        // Check team access
        checkTeamAccess(teamId);
        
        return teamRepository.findById(teamId)
            .orElseThrow(() -> new RuntimeException("Team not found"));
    }
}
