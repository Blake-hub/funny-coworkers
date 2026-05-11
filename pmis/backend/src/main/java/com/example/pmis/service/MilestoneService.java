package com.example.pmis.service;

import com.example.pmis.dto.CreateMilestoneRequest;
import com.example.pmis.dto.MilestoneDTO;
import com.example.pmis.entity.Milestone;
import com.example.pmis.entity.Project;
import com.example.pmis.repository.MilestoneRepository;
import com.example.pmis.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<MilestoneDTO> getMilestonesByProject(Long projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new RuntimeException("Project not found with id: " + projectId);
        }
        return milestoneRepository.findByProjectId(projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public MilestoneDTO getMilestoneById(Long projectId, Long id) {
        Milestone milestone = milestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found with id: " + id));
        if (!milestone.getProjectId().equals(projectId)) {
            throw new RuntimeException("Milestone does not belong to project: " + projectId);
        }
        return convertToDTO(milestone);
    }

    @Transactional
    public MilestoneDTO createMilestone(Long projectId, CreateMilestoneRequest request) {
        if (!projectRepository.existsById(projectId)) {
            throw new RuntimeException("Project not found with id: " + projectId);
        }
        Milestone milestone = Milestone.builder()
                .projectId(projectId)
                .name(request.getName())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .completed(false)
                .build();
        Milestone savedMilestone = milestoneRepository.save(milestone);
        updateProjectProgress(projectId);
        return convertToDTO(savedMilestone);
    }

    @Transactional
    public MilestoneDTO updateMilestone(Long projectId, Long id, CreateMilestoneRequest request) {
        Milestone milestone = milestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found with id: " + id));
        if (!milestone.getProjectId().equals(projectId)) {
            throw new RuntimeException("Milestone does not belong to project: " + projectId);
        }

        milestone.setName(request.getName());
        milestone.setDescription(request.getDescription());
        milestone.setDueDate(request.getDueDate());

        Milestone updatedMilestone = milestoneRepository.save(milestone);
        return convertToDTO(updatedMilestone);
    }

    @Transactional
    public void deleteMilestone(Long projectId, Long id) {
        Milestone milestone = milestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found with id: " + id));
        if (!milestone.getProjectId().equals(projectId)) {
            throw new RuntimeException("Milestone does not belong to project: " + projectId);
        }
        milestoneRepository.delete(milestone);
        updateProjectProgress(projectId);
    }

    @Transactional
    public MilestoneDTO completeMilestone(Long projectId, Long id) {
        Milestone milestone = milestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found with id: " + id));
        if (!milestone.getProjectId().equals(projectId)) {
            throw new RuntimeException("Milestone does not belong to project: " + projectId);
        }
        milestone.setCompleted(true);
        Milestone updatedMilestone = milestoneRepository.save(milestone);
        updateProjectProgress(projectId);
        return convertToDTO(updatedMilestone);
    }

    private void updateProjectProgress(Long projectId) {
        long totalMilestones = milestoneRepository.countByProjectIdAndCompleted(projectId, false)
                + milestoneRepository.countByProjectIdAndCompleted(projectId, true);
        long completedMilestones = milestoneRepository.countByProjectIdAndCompleted(projectId, true);

        int progress = totalMilestones > 0 ? (int) ((completedMilestones * 100) / totalMilestones) : 0;

        Project project = projectRepository.findById(projectId).orElse(null);
        if (project != null) {
            project.setProgress(progress);
            projectRepository.save(project);
        }
    }

    private MilestoneDTO convertToDTO(Milestone milestone) {
        return MilestoneDTO.builder()
                .id(milestone.getId())
                .projectId(milestone.getProjectId())
                .name(milestone.getName())
                .description(milestone.getDescription())
                .dueDate(milestone.getDueDate())
                .completed(milestone.getCompleted())
                .createdAt(milestone.getCreatedAt())
                .updatedAt(milestone.getUpdatedAt())
                .build();
    }
}