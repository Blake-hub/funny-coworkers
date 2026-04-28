package com.example.pmis.service;

import com.example.pmis.dto.TeamDTO;
import com.example.pmis.entity.Team;
import com.example.pmis.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepository;

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
        teamRepository.deleteById(id);
    }

    private TeamDTO convertToDTO(Team team) {
        return TeamDTO.builder()
                .id(team.getId())
                .identifier(team.getIdentifier())
                .name(team.getName())
                .description(team.getDescription())
                .memberCount(team.getMemberCount())
                .leadName(team.getLeadName())
                .build();
    }

    private Team convertToEntity(TeamDTO teamDTO) {
        return Team.builder()
                .identifier(teamDTO.getIdentifier())
                .name(teamDTO.getName())
                .description(teamDTO.getDescription())
                .memberCount(teamDTO.getMemberCount())
                .leadName(teamDTO.getLeadName())
                .build();
    }
}