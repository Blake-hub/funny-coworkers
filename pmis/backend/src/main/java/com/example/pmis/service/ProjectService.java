package com.example.pmis.service;

import com.example.pmis.dto.*;
import com.example.pmis.entity.*;
import com.example.pmis.entity.enumaration.ProjectPriority;
import com.example.pmis.entity.enumaration.ProjectStatus;
import com.example.pmis.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final LabelDefinitionRepository labelDefinitionRepository;
    private final ProjectLabelAssignmentRepository projectLabelAssignmentRepository;
    private final UserRepository userRepository;
    private final IssueRepository issueRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    @Transactional(readOnly = true)
    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> getProjectsForUser(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return new ArrayList<>();
        }
        
        if (user.getRole() == com.example.pmis.entity.enumeration.Role.ADMIN) {
            return projectRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        }
        
        List<Long> memberTeamIds = teamMemberRepository.findByUserId(userId).stream()
                .map(tm -> tm.getTeamId())
                .collect(Collectors.toList());
        
        List<Long> ownedTeamIds = teamRepository.findByOwnerId(userId).stream()
                .map(Team::getId)
                .collect(Collectors.toList());
        
        List<Long> allTeamIds = new ArrayList<>(new java.util.HashSet<>(memberTeamIds));
        allTeamIds.addAll(ownedTeamIds);
        
        final List<Long> finalTeamIds = allTeamIds;
        
        return projectRepository.findAll().stream()
                .filter(project -> project.getTeamId() != null && finalTeamIds.contains(project.getTeamId()))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
        return convertToDTO(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> getProjectsByLeader(Long leaderId) {
        return projectRepository.findByLeaderId(leaderId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectDTO createProject(CreateProjectRequest request) {
        Project project = Project.builder()
                .name(request.getName())
                .summary(request.getSummary())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : 1)
                .priority(request.getPriority() != null ? request.getPriority() : 0)
                .leaderId(request.getLeaderId())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .teamId(request.getTeamId())
                .progress(0)
                .build();

        Project savedProject = projectRepository.save(project);

        if (request.getMemberIds() != null) {
            for (Long memberId : request.getMemberIds()) {
                ProjectMember member = ProjectMember.builder()
                        .projectId(savedProject.getId())
                        .userId(memberId)
                        .build();
                projectMemberRepository.save(member);
            }
        }

        ProjectMember leaderMember = ProjectMember.builder()
                .projectId(savedProject.getId())
                .userId(request.getLeaderId())
                .role("leader")
                .build();
        projectMemberRepository.save(leaderMember);

        if (request.getLabels() != null) {
            for (LabelAssignmentRequest labelRequest : request.getLabels()) {
                LabelDefinition label;
                if (labelRequest.getId() != null) {
                    label = labelDefinitionRepository.findById(labelRequest.getId())
                            .orElseThrow(() -> new RuntimeException("Label not found with id: " + labelRequest.getId()));
                } else if (labelRequest.getName() != null) {
                    label = labelDefinitionRepository.findByName(labelRequest.getName())
                            .orElseGet(() -> {
                                LabelDefinition newLabel = LabelDefinition.builder()
                                        .name(labelRequest.getName())
                                        .color(labelRequest.getColor() != null ? labelRequest.getColor() : "#6b7280")
                                        .build();
                                return labelDefinitionRepository.save(newLabel);
                            });
                } else {
                    continue;
                }

                if (!projectLabelAssignmentRepository.existsByProjectIdAndLabelId(savedProject.getId(), label.getId())) {
                    ProjectLabelAssignment assignment = ProjectLabelAssignment.builder()
                            .projectId(savedProject.getId())
                            .labelId(label.getId())
                            .build();
                    projectLabelAssignmentRepository.save(assignment);
                }
            }
        }

        if (request.getMilestones() != null) {
            for (CreateMilestoneRequest milestoneRequest : request.getMilestones()) {
                Milestone milestone = Milestone.builder()
                        .projectId(savedProject.getId())
                        .name(milestoneRequest.getName())
                        .description(milestoneRequest.getDescription())
                        .dueDate(milestoneRequest.getDueDate())
                        .completed(false)
                        .build();
                milestoneRepository.save(milestone);
            }
        }

        return convertToDTO(savedProject);
    }

    @Transactional
    public ProjectDTO updateProject(Long id, UpdateProjectRequest request) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        if (request.getName() != null) {
            existingProject.setName(request.getName());
        }
        if (request.getSummary() != null) {
            existingProject.setSummary(request.getSummary());
        }
        if (request.getDescription() != null) {
            existingProject.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            existingProject.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            existingProject.setPriority(request.getPriority());
        }
        if (request.getLeaderId() != null) {
            existingProject.setLeaderId(request.getLeaderId());
        }
        if (request.getStartDate() != null) {
            existingProject.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            existingProject.setEndDate(request.getEndDate());
        }
        if (request.getProgress() != null) {
            existingProject.setProgress(request.getProgress());
        }

        Project updatedProject = projectRepository.save(existingProject);
        return convertToDTO(updatedProject);
    }

    @Transactional
    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new RuntimeException("Project not found with id: " + id);
        }
        milestoneRepository.deleteByProjectId(id);
        projectMemberRepository.deleteByProjectId(id);
        projectLabelAssignmentRepository.deleteByProjectId(id);
        projectRepository.deleteById(id);
    }

    @Transactional
    public void addMember(Long projectId, Long userId) {
        if (!projectRepository.existsById(projectId)) {
            throw new RuntimeException("Project not found with id: " + projectId);
        }
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found with id: " + userId);
        }
        if (projectMemberRepository.findByProjectIdAndUserId(projectId, userId).isPresent()) {
            throw new RuntimeException("User is already a member of this project");
        }
        ProjectMember member = ProjectMember.builder()
                .projectId(projectId)
                .userId(userId)
                .build();
        projectMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(Long projectId, Long userId) {
        ProjectMember member = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new RuntimeException("Member not found in project"));
        projectMemberRepository.delete(member);
    }

    @Transactional
    public void assignLabel(Long projectId, Long labelId) {
        if (!projectRepository.existsById(projectId)) {
            throw new RuntimeException("Project not found with id: " + projectId);
        }
        if (!labelDefinitionRepository.existsById(labelId)) {
            throw new RuntimeException("Label not found with id: " + labelId);
        }
        if (projectLabelAssignmentRepository.existsByProjectIdAndLabelId(projectId, labelId)) {
            throw new RuntimeException("Label is already assigned to this project");
        }
        ProjectLabelAssignment assignment = ProjectLabelAssignment.builder()
                .projectId(projectId)
                .labelId(labelId)
                .build();
        projectLabelAssignmentRepository.save(assignment);
    }

    @Transactional
    public void removeLabel(Long projectId, Long labelId) {
        ProjectLabelAssignment assignment = projectLabelAssignmentRepository
                .findByProjectIdAndLabelId(projectId, labelId)
                .orElseThrow(() -> new RuntimeException("Label assignment not found"));
        projectLabelAssignmentRepository.delete(assignment);
    }

    @Transactional
    public void updateLabels(Long projectId, List<Long> labelIds) {
        projectLabelAssignmentRepository.deleteByProjectId(projectId);
        if (labelIds != null) {
            for (Long labelId : labelIds) {
                ProjectLabelAssignment assignment = ProjectLabelAssignment.builder()
                        .projectId(projectId)
                        .labelId(labelId)
                        .build();
                projectLabelAssignmentRepository.save(assignment);
            }
        }
    }

    private ProjectDTO convertToDTO(Project project) {
        String leaderName = userRepository.findById(project.getLeaderId())
                .map(User::getName)
                .orElse(null);

        List<Milestone> milestones = milestoneRepository.findByProjectId(project.getId());
        List<MilestoneDTO> milestoneDTOs = milestones.stream()
                .map(m -> MilestoneDTO.builder()
                        .id(m.getId())
                        .projectId(m.getProjectId())
                        .name(m.getName())
                        .description(m.getDescription())
                        .dueDate(m.getDueDate())
                        .completed(m.getCompleted())
                        .createdAt(m.getCreatedAt())
                        .updatedAt(m.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        List<ProjectLabelAssignment> labelAssignments = projectLabelAssignmentRepository.findByProjectId(project.getId());
        List<LabelDTO> labelDTOs = new ArrayList<>();
        for (ProjectLabelAssignment assignment : labelAssignments) {
            labelDefinitionRepository.findById(assignment.getLabelId())
                    .ifPresent(label -> labelDTOs.add(LabelDTO.builder()
                            .id(label.getId())
                            .name(label.getName())
                            .color(label.getColor())
                            .description(label.getDescription())
                            .createdAt(label.getCreatedAt())
                            .build()));
        }

        long memberCount = projectMemberRepository.countByProjectId(project.getId());
        long issueCount = issueRepository.countByProjectId(project.getId());
        long openIssues = issueRepository.countByProjectIdAndStatusIdNot(project.getId(), 4);

        return ProjectDTO.builder()
                .id(project.getId())
                .name(project.getName())
                .summary(project.getSummary())
                .description(project.getDescription())
                .status(project.getStatus())
                .statusLabel(getStatusLabel(project.getStatus()))
                .priority(project.getPriority())
                .priorityLabel(getPriorityLabel(project.getPriority()))
                .leaderId(project.getLeaderId())
                .leaderName(leaderName)
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .progress(project.getProgress())
                .memberCount((int) memberCount)
                .issueCount((int) issueCount)
                .openIssues((int) openIssues)
                .labels(labelDTOs)
                .milestones(milestoneDTOs)
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private String getStatusLabel(Integer status) {
        try {
            return ProjectStatus.fromValue(status).getLabel();
        } catch (IllegalArgumentException e) {
            return "Unknown";
        }
    }

    private String getPriorityLabel(Integer priority) {
        try {
            return ProjectPriority.fromValue(priority).getLabel();
        } catch (IllegalArgumentException e) {
            return "Unknown";
        }
    }
}