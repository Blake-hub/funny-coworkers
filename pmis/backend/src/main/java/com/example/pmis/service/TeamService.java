package com.example.pmis.service;

import com.example.pmis.dto.TeamDTO;
import com.example.pmis.dto.UserDTO;
import com.example.pmis.entity.Team;
import com.example.pmis.entity.TeamMember;
import com.example.pmis.entity.User;
import com.example.pmis.entity.enumeration.Role;
import com.example.pmis.repository.TeamMemberRepository;
import com.example.pmis.repository.TeamRepository;
import com.example.pmis.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;

    @Transactional(readOnly = true)
    public List<TeamDTO> getAllTeams() {
        return teamRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TeamDTO getTeamById(Long id) {
        return teamRepository.findById(id)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public TeamDTO getTeamByIdentifier(String identifier) {
        return teamRepository.findByIdentifier(identifier)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("Team not found with identifier: " + identifier));
    }

    @Transactional
    public TeamDTO createTeam(TeamDTO teamDTO) {
        if (teamRepository.existsByIdentifier(teamDTO.getIdentifier())) {
            throw new RuntimeException("Team identifier already exists");
        }
        Team team = convertToEntity(teamDTO);
        Team savedTeam = teamRepository.save(team);
        
        if (savedTeam.getOwnerId() != null) {
            addTeamMember(savedTeam.getId(), savedTeam.getOwnerId(), Role.TEAM_MEMBER);
        }
        
        return convertToDTO(savedTeam);
    }

    @Transactional
    public TeamDTO updateTeam(Long id, TeamDTO teamDTO) {
        Team existingTeam = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + id));

        if (!existingTeam.getIdentifier().equals(teamDTO.getIdentifier()) 
                && teamRepository.existsByIdentifier(teamDTO.getIdentifier())) {
            throw new RuntimeException("Team identifier already exists");
        }

        existingTeam.setIdentifier(teamDTO.getIdentifier());
        existingTeam.setName(teamDTO.getName());
        existingTeam.setDescription(teamDTO.getDescription());
        existingTeam.setMemberCount(teamDTO.getMemberCount());
        existingTeam.setLeadName(teamDTO.getLeadName());

        Team updatedTeam = teamRepository.save(existingTeam);
        return convertToDTO(updatedTeam);
    }

    @Transactional
    public void deleteTeam(Long id) {
        if (!teamRepository.existsById(id)) {
            throw new RuntimeException("Team not found with id: " + id);
        }
        
        teamMemberRepository.deleteByTeamId(id);
        
        teamRepository.deleteById(id);
    }

    @Transactional
    public void addTeamMember(Long teamId, Long userId, Role role) {
        if (!teamRepository.existsById(teamId)) {
            throw new RuntimeException("Team not found with id: " + teamId);
        }
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new RuntimeException("User is already a member of this team");
        }
        
        TeamMember teamMember = TeamMember.builder()
                .teamId(teamId)
                .userId(userId)
                .role(role)
                .build();
        teamMemberRepository.save(teamMember);
        
        updateMemberCount(teamId);
    }

    @Transactional
    public void removeTeamMember(Long teamId, Long userId) {
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new RuntimeException("User is not a member of this team");
        }
        
        teamMemberRepository.deleteByTeamIdAndUserId(teamId, userId);
        
        updateMemberCount(teamId);
    }

    @Transactional
    public void updateTeamMemberRole(Long teamId, Long userId, Role role) {
        TeamMember teamMember = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new RuntimeException("User is not a member of this team"));
        
        teamMember.setRole(role);
        teamMemberRepository.save(teamMember);
    }

    @Transactional(readOnly = true)
    public List<UserDTO> getTeamMembers(Long teamId) {
        if (!teamRepository.existsById(teamId)) {
            throw new RuntimeException("Team not found with id: " + teamId);
        }
        
        return teamMemberRepository.findByTeamId(teamId).stream()
                .map(tm -> userRepository.findById(tm.getUserId())
                        .map(this::convertUserToDTO)
                        .orElse(null))
                .filter(u -> u != null)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TeamDTO> getTeamsForUser(Long userId) {
        return teamMemberRepository.findByUserId(userId).stream()
                .map(tm -> teamRepository.findById(tm.getTeamId())
                        .map(this::convertToDTO)
                        .orElse(null))
                .filter(t -> t != null)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Role getUserRoleInTeam(Long teamId, Long userId) {
        return teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .map(TeamMember::getRole)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public boolean isTeamOwner(Long teamId, Long userId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));
        return team.getOwnerId().equals(userId);
    }

    @Transactional(readOnly = true)
    public boolean hasTeamPermission(Long teamId, Long userId, Role requiredRole) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));
        
        if (team.getOwnerId().equals(userId)) {
            return true;
        }
        
        return teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .map(tm -> {
                    if (requiredRole == Role.ADMIN) {
                        return tm.getRole() == Role.ADMIN;
                    } else if (requiredRole == Role.TEAM_OWNER) {
                        return tm.getRole() == Role.ADMIN || tm.getRole() == Role.TEAM_OWNER;
                    }
                    return true;
                })
                .orElse(false);
    }

    private void updateMemberCount(Long teamId) {
        Team team = teamRepository.findById(teamId).orElseThrow();
        int memberCount = (int) teamMemberRepository.findByTeamId(teamId).size();
        team.setMemberCount(memberCount);
        teamRepository.save(team);
    }

    private UserDTO convertUserToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .organizationId(user.getOrganizationId())
                .departmentId(user.getDepartmentId())
                .build();
    }

    private TeamDTO convertToDTO(Team team) {
        String ownerName = userRepository.findById(team.getOwnerId())
                .map(User::getName)
                .orElse("Unknown");
        
        return TeamDTO.builder()
                .id(team.getId())
                .identifier(team.getIdentifier())
                .name(team.getName())
                .description(team.getDescription())
                .memberCount(team.getMemberCount())
                .leadName(team.getLeadName())
                .ownerName(ownerName)
                .ownerId(team.getOwnerId())
                .build();
    }

    private Team convertToEntity(TeamDTO teamDTO) {
        return Team.builder()
                .identifier(teamDTO.getIdentifier())
                .name(teamDTO.getName())
                .description(teamDTO.getDescription())
                .memberCount(teamDTO.getMemberCount())
                .leadName(teamDTO.getLeadName())
                .ownerId(teamDTO.getOwnerId())
                .build();
    }

    @Transactional
    public TeamDTO transferOwnership(Long teamId, Long newOwnerId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found with id: " + teamId));
        
        if (!userRepository.existsById(newOwnerId)) {
            throw new RuntimeException("User not found with id: " + newOwnerId);
        }
        
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, newOwnerId)) {
            throw new RuntimeException("New owner must be a member of the team");
        }
        
        Long oldOwnerId = team.getOwnerId();
        team.setOwnerId(newOwnerId);
        
        Team updatedTeam = teamRepository.save(team);
        
        return convertToDTO(updatedTeam);
    }
}