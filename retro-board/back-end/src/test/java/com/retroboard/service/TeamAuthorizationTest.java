package com.retroboard.service;

import com.retroboard.entity.Team;
import com.retroboard.entity.TeamMember;
import com.retroboard.entity.User;
import com.retroboard.repository.TeamRepository;
import com.retroboard.repository.TeamMemberRepository;
import com.retroboard.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class TeamAuthorizationTest {
    
    @Mock
    private TeamRepository teamRepository;
    
    @Mock
    private TeamMemberRepository teamMemberRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private Authentication authentication;
    
    @Mock
    private SecurityContext securityContext;
    
    @Mock
    private UserDetails userDetails;
    
    @InjectMocks
    private TeamService teamService;
    
    private User currentUser;
    private User otherUser;
    private Team ownedTeam;
    private Team memberTeam;
    private Team otherTeam;
    
    @BeforeEach
    void setUp() {
        // Set up security context
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        
        // Create test users
        currentUser = new User();
        currentUser.setId(1L);
        currentUser.setUsername("currentuser");
        currentUser.setPassword("password");
        currentUser.setEmail("current@example.com");
        currentUser.setDisabled(false);
        currentUser.setCreatedAt(LocalDateTime.now());
        
        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setUsername("otheruser");
        otherUser.setPassword("password");
        otherUser.setEmail("other@example.com");
        otherUser.setDisabled(false);
        otherUser.setCreatedAt(LocalDateTime.now());
        
        // Create test teams
        ownedTeam = new Team();
        ownedTeam.setId(1L);
        ownedTeam.setName("Owned Team");
        ownedTeam.setOwner(currentUser);
        ownedTeam.setCreatedAt(LocalDateTime.now());
        
        memberTeam = new Team();
        memberTeam.setId(2L);
        memberTeam.setName("Member Team");
        memberTeam.setOwner(otherUser);
        memberTeam.setCreatedAt(LocalDateTime.now());
        
        otherTeam = new Team();
        otherTeam.setId(3L);
        otherTeam.setName("Other Team");
        otherTeam.setOwner(otherUser);
        otherTeam.setCreatedAt(LocalDateTime.now());
        
        // Note: Team membership is mocked in the repository methods
        // No need to create actual TeamMember objects for this test
        
        // Mock user details
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("currentuser");
        when(userRepository.findByUsername("currentuser")).thenReturn(Optional.of(currentUser));
        
        // Mock team repository methods with more flexible matchers
        // that will work for all tests
        when(teamRepository.existsByTeamIdAndOwnerOrMember(anyLong(), eq(currentUser))).thenAnswer(invocation -> {
            Long teamId = invocation.getArgument(0);
            return teamId == 1L || teamId == 2L; // only teams 1 and 2 are accessible
        });
        
        when(teamRepository.findByOwnerOrMember(eq(currentUser))).thenReturn(List.of(ownedTeam, memberTeam));
        
        when(teamRepository.findById(anyLong())).thenAnswer(invocation -> {
            Long teamId = invocation.getArgument(0);
            if (teamId == 1L) return Optional.of(ownedTeam);
            if (teamId == 2L) return Optional.of(memberTeam);
            if (teamId == 3L) return Optional.of(otherTeam);
            return Optional.empty();
        });
        
        // Mock delete method
        doNothing().when(teamRepository).delete(any(Team.class));
    }
    
    @Test
    void testGetAllTeams_returnsOnlyAccessibleTeams() {
        List<Team> teams = teamService.getAllTeams();
        
        assertEquals(2, teams.size());
        assertTrue(teams.contains(ownedTeam));
        assertTrue(teams.contains(memberTeam));
        assertFalse(teams.contains(otherTeam));
        
        verify(teamRepository, times(1)).findByOwnerOrMember(currentUser);
    }
    
    @Test
    void testGetTeamById_ownedTeam_success() {
        Team team = teamService.getTeamById(1L);
        assertNotNull(team);
        assertEquals(ownedTeam.getId(), team.getId());
        
        verify(teamRepository, times(1)).existsByTeamIdAndOwnerOrMember(1L, currentUser);
        verify(teamRepository, times(1)).findById(1L);
    }
    
    @Test
    void testGetTeamById_memberTeam_success() {
        Team team = teamService.getTeamById(2L);
        assertNotNull(team);
        assertEquals(memberTeam.getId(), team.getId());
        
        verify(teamRepository, times(1)).existsByTeamIdAndOwnerOrMember(2L, currentUser);
        verify(teamRepository, times(1)).findById(2L);
    }
    
    @Test
    void testGetTeamById_otherTeam_throwsAccessDenied() {
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            teamService.getTeamById(3L);
        });
        
        assertEquals("Access denied: You don't have permission to access this team", exception.getMessage());
        verify(teamRepository, times(1)).existsByTeamIdAndOwnerOrMember(3L, currentUser);
        verify(teamRepository, never()).findById(3L);
    }
    
    @Test
    void testDeleteTeam_ownedTeam_success() {
        teamService.deleteTeam(1L);
        
        verify(teamRepository, times(1)).existsByTeamIdAndOwnerOrMember(1L, currentUser);
        verify(teamRepository, times(1)).findById(1L);
        verify(teamRepository, times(1)).delete(ownedTeam);
    }
    
    @Test
    void testDeleteTeam_otherTeam_throwsAccessDenied() {
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            teamService.deleteTeam(3L);
        });
        
        assertEquals("Access denied: You don't have permission to access this team", exception.getMessage());
        verify(teamRepository, times(1)).existsByTeamIdAndOwnerOrMember(3L, currentUser);
        verify(teamRepository, never()).findById(3L);
        verify(teamRepository, never()).delete(any(Team.class));
    }
}
