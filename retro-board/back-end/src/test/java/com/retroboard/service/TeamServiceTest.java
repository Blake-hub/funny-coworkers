package com.retroboard.service;

import com.retroboard.entity.Team;
import com.retroboard.entity.TeamMember;
import com.retroboard.entity.User;
import com.retroboard.repository.TeamRepository;
import com.retroboard.repository.TeamMemberRepository;
import com.retroboard.repository.UserRepository;
import com.retroboard.dto.CreateTeamRequest;
import com.retroboard.dto.UpdateTeamRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TeamServiceTest {
    
    @Mock
    private TeamRepository teamRepository;
    
    @Mock
    private TeamMemberRepository teamMemberRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @InjectMocks
    private TeamService teamService;
    
    private User owner;
    private Team team;
    private CreateTeamRequest createTeamRequest;
    private UpdateTeamRequest updateTeamRequest;
    
    @BeforeEach
    void setUp() {
        // Create test user
        owner = new User();
        owner.setId(1L);
        owner.setUsername("testuser");
        owner.setPassword("password");
        owner.setEmail("test@example.com");
        owner.setDisabled(false);
        owner.setCreatedAt(LocalDateTime.now());
        
        // Create test team
        team = new Team();
        team.setId(1L);
        team.setName("Test Team");
        team.setOwner(owner);
        team.setCreatedAt(LocalDateTime.now());
        
        // Create test create team request
        createTeamRequest = new CreateTeamRequest();
        createTeamRequest.setName("Test Team");
        createTeamRequest.setOwnerId(1L);
        
        // Create test update team request
        updateTeamRequest = new UpdateTeamRequest();
        updateTeamRequest.setName("Updated Team");
        
        // Create team member request
        UpdateTeamRequest.TeamMemberRequest memberRequest = new UpdateTeamRequest.TeamMemberRequest();
        memberRequest.setUserId(1L);
        memberRequest.setRole("owner");
        
        updateTeamRequest.setMembers(List.of(memberRequest));
    }
    
    @Test
    void testCreateTeam() {
        // Mock repository methods
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(teamRepository.save(any(Team.class))).thenReturn(team);
        when(teamMemberRepository.save(any(TeamMember.class))).thenReturn(new TeamMember());
        
        // Call service method
        Team createdTeam = teamService.createTeam(createTeamRequest);
        
        // Verify results
        assertNotNull(createdTeam);
        assertEquals("Test Team", createdTeam.getName());
        assertEquals(owner, createdTeam.getOwner());
        
        // Verify repository calls
        verify(userRepository, times(1)).findById(1L);
        verify(teamRepository, times(1)).save(any(Team.class));
        verify(teamMemberRepository, times(1)).save(any(TeamMember.class));
    }
    
    @Test
    void testCreateTeam_OwnerNotFound() {
        // Mock repository method to return empty
        when(userRepository.findById(1L)).thenReturn(Optional.empty());
        
        // Verify exception is thrown
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            teamService.createTeam(createTeamRequest);
        });
        
        assertEquals("Owner not found", exception.getMessage());
    }
    
    @Test
    void testDeleteTeam() {
        // Mock repository methods
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));
        doNothing().when(teamRepository).delete(team);
        
        // Call service method
        teamService.deleteTeam(1L);
        
        // Verify repository calls
        verify(teamRepository, times(1)).findById(1L);
        verify(teamRepository, times(1)).delete(team);
    }
    
    @Test
    void testDeleteTeam_TeamNotFound() {
        // Mock repository method to return empty
        when(teamRepository.findById(1L)).thenReturn(Optional.empty());
        
        // Verify exception is thrown
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            teamService.deleteTeam(1L);
        });
        
        assertEquals("Team not found", exception.getMessage());
    }
    
    @Test
    void testGetAllTeams() {
        // Mock repository method
        when(teamRepository.findAll()).thenReturn(List.of(team));
        
        // Call service method
        List<Team> teams = teamService.getAllTeams();
        
        // Verify results
        assertNotNull(teams);
        assertEquals(1, teams.size());
        assertEquals(team, teams.get(0));
        
        // Verify repository call
        verify(teamRepository, times(1)).findAll();
    }
    
    @Test
    void testUpdateTeam() {
        // Mock repository methods
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));
        when(teamRepository.save(any(Team.class))).thenReturn(team);
        when(teamMemberRepository.findByTeam(team)).thenReturn(List.of());
        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(teamMemberRepository.findByTeamAndUser(team, owner)).thenReturn(Optional.empty());
        when(teamMemberRepository.save(any(TeamMember.class))).thenReturn(new TeamMember());
        
        // Call service method
        Team updatedTeam = teamService.updateTeam(1L, updateTeamRequest);
        
        // Verify results
        assertNotNull(updatedTeam);
        assertEquals("Updated Team", updatedTeam.getName());
        
        // Verify repository calls
        verify(teamRepository, times(1)).findById(1L);
        verify(teamRepository, times(1)).save(any(Team.class));
    }
    
    @Test
    void testUpdateTeam_TeamNotFound() {
        // Mock repository method to return empty
        when(teamRepository.findById(1L)).thenReturn(Optional.empty());
        
        // Verify exception is thrown
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            teamService.updateTeam(1L, updateTeamRequest);
        });
        
        assertEquals("Team not found", exception.getMessage());
    }
    
    @Test
    void testGetTeamById() {
        // Mock repository method
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));
        
        // Call service method
        Team foundTeam = teamService.getTeamById(1L);
        
        // Verify results
        assertNotNull(foundTeam);
        assertEquals(team, foundTeam);
        
        // Verify repository call
        verify(teamRepository, times(1)).findById(1L);
    }
    
    @Test
    void testGetTeamById_TeamNotFound() {
        // Mock repository method to return empty
        when(teamRepository.findById(1L)).thenReturn(Optional.empty());
        
        // Verify exception is thrown
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            teamService.getTeamById(1L);
        });
        
        assertEquals("Team not found", exception.getMessage());
    }
}
