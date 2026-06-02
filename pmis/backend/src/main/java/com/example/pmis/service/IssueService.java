package com.example.pmis.service;

import com.example.pmis.dto.CreateIssueDTO;
import com.example.pmis.dto.IssueDTO;
import com.example.pmis.dto.UpdateIssueDTO;
import com.example.pmis.entity.Issue;
import com.example.pmis.entity.Project;
import com.example.pmis.entity.Team;
import com.example.pmis.entity.TeamMember;
import com.example.pmis.entity.User;
import com.example.pmis.entity.enumeration.Role;
import com.example.pmis.repository.IssueRepository;
import com.example.pmis.repository.ProjectRepository;
import com.example.pmis.repository.TeamIssueCounterRepository;
import com.example.pmis.repository.TeamMemberRepository;
import com.example.pmis.repository.TeamRepository;
import com.example.pmis.repository.UserRepository;
import com.example.pmis.entity.TeamIssueCounter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final TeamIssueCounterRepository teamIssueCounterRepository;

    @Transactional(readOnly = true)
    public List<IssueDTO> getIssuesByProject(Long projectId) {
        List<Issue> issues;
        if (projectId != null) {
            issues = issueRepository.findByProjectIdOrderByStatusIdAscSortOrderAsc(projectId);
        } else {
            issues = issueRepository.findAll();
        }
        return issues.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IssueDTO> getIssuesForUser(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return new ArrayList<>();
        }

        if (user.getRole() == Role.ADMIN) {
            return issueRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }

        List<Long> memberTeamIds = teamMemberRepository.findByUserId(userId).stream()
                .map(TeamMember::getTeamId)
                .collect(Collectors.toList());

        List<Long> ownedTeamIds = teamRepository.findByOwnerId(userId).stream()
                .map(Team::getId)
                .collect(Collectors.toList());

        List<Long> allTeamIds = new ArrayList<>(new HashSet<>(memberTeamIds));
        allTeamIds.addAll(ownedTeamIds);

        if (allTeamIds.isEmpty()) {
            return new ArrayList<>();
        }

        return issueRepository.findByTeamIdIn(allTeamIds).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public IssueDTO getIssue(Long id) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Issue not found with id: " + id));
        return convertToDTO(issue);
    }

    @Transactional
    public IssueDTO createIssue(CreateIssueDTO dto) {
        Issue issue = Issue.builder()
                .title(dto.getTitle())
                .description(dto.getDescription())
                .statusId(dto.getStatusId() != null ? dto.getStatusId() : 1)
                .priorityId(dto.getPriorityId())
                .build();

        if (dto.getProjectId() != null) {
            Project project = projectRepository.findById(dto.getProjectId())
                    .orElseThrow(() -> new RuntimeException("Project not found with id: " + dto.getProjectId()));
            issue.setProject(project);
        }

        Team team = null;
        if (dto.getTeamId() != null) {
            team = teamRepository.findById(dto.getTeamId())
                    .orElseThrow(() -> new RuntimeException("Team not found with id: " + dto.getTeamId()));
            issue.setTeam(team);
        }

        if (dto.getAssigneeId() != null) {
            User assignee = userRepository.findById(dto.getAssigneeId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getAssigneeId()));
            issue.setAssignee(assignee);
        }

        if (dto.getReporterId() != null) {
            User reporter = userRepository.findById(dto.getReporterId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getReporterId()));
            issue.setReporter(reporter);
        }

        if (team != null) {
            final Long teamId = team.getId();
            TeamIssueCounter counter = teamIssueCounterRepository.findByTeamIdWithLock(teamId)
                    .orElseGet(() -> {
                        TeamIssueCounter newCounter = TeamIssueCounter.builder()
                                .teamId(teamId)
                                .nextIssueNumber(1)
                                .build();
                        return teamIssueCounterRepository.save(newCounter);
                    });
            
            issue.setTeamIssueNumber(counter.getNextIssueNumber());
            counter.setNextIssueNumber(counter.getNextIssueNumber() + 1);
            teamIssueCounterRepository.save(counter);
        }

        Integer maxSortOrder = issueRepository.findMaxSortOrderByStatusId(issue.getStatusId()).orElse(-1);
        issue.setSortOrder(maxSortOrder + 1);

        Issue saved = issueRepository.save(issue);
        return convertToDTO(saved);
    }

    @Transactional
    public IssueDTO updateIssue(Long id, UpdateIssueDTO dto) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Issue not found with id: " + id));

        if (dto.getTitle() != null) {
            issue.setTitle(dto.getTitle());
        }
        if (dto.getDescription() != null) {
            issue.setDescription(dto.getDescription());
        }
        if (dto.getStatusId() != null) {
            issue.setStatusId(dto.getStatusId());
        }
        if (dto.getAssigneeId() != null) {
            User assignee = userRepository.findById(dto.getAssigneeId())
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getAssigneeId()));
            issue.setAssignee(assignee);
        }
        if (dto.getPriorityId() != null) {
            issue.setPriorityId(dto.getPriorityId());
        }

        Issue saved = issueRepository.save(issue);
        return convertToDTO(saved);
    }

    @Transactional
    public void deleteIssue(Long id) {
        if (!issueRepository.existsById(id)) {
            throw new RuntimeException("Issue not found with id: " + id);
        }
        issueRepository.deleteById(id);
    }

    @Transactional
    public IssueDTO updateIssueStatus(Long id, Integer statusId, Integer sortOrder) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Issue not found with id: " + id));

        issue.setStatusId(statusId);
        if (sortOrder != null) {
            issue.setSortOrder(sortOrder);
        } else {
            Integer maxSortOrder = issueRepository.findMaxSortOrderByStatusId(statusId).orElse(-1);
            issue.setSortOrder(maxSortOrder + 1);
        }

        Issue saved = issueRepository.save(issue);
        return convertToDTO(saved);
    }

    @Transactional
    public IssueDTO updateIssueSortOrder(Long id, Integer sortOrder) {
        Issue issue = issueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Issue not found with id: " + id));

        issue.setSortOrder(sortOrder);
        Issue saved = issueRepository.save(issue);
        return convertToDTO(saved);
    }

    private IssueDTO convertToDTO(Issue entity) {
        return IssueDTO.builder()
                .id(entity.getId())
                .projectId(entity.getProject() != null ? entity.getProject().getId() : null)
                .teamId(entity.getTeam() != null ? entity.getTeam().getId() : null)
                .teamIdentifier(entity.getTeam() != null ? entity.getTeam().getIdentifier() : null)
                .teamIssueNumber(entity.getTeamIssueNumber())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .statusId(entity.getStatusId())
                .sortOrder(entity.getSortOrder())
                .assigneeId(entity.getAssignee() != null ? entity.getAssignee().getId() : null)
                .assigneeName(entity.getAssignee() != null ? entity.getAssignee().getName() : null)
                .reporterId(entity.getReporter() != null ? entity.getReporter().getId() : null)
                .reporterName(entity.getReporter() != null ? entity.getReporter().getName() : null)
                .priorityId(entity.getPriorityId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}