package com.example.pmis.service;

import com.example.pmis.dto.ProjectDTO;
import com.example.pmis.entity.Project;
import com.example.pmis.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(Long id) {
        return projectRepository.findById(id)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<ProjectDTO> getProjectsByLeader(Long leaderId) {
        return projectRepository.findByLeaderId(leaderId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectDTO createProject(ProjectDTO projectDTO) {
        Project project = convertToEntity(projectDTO);
        Project savedProject = projectRepository.save(project);
        return convertToDTO(savedProject);
    }

    @Transactional
    public ProjectDTO updateProject(Long id, ProjectDTO projectDTO) {
        Project existingProject = projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));

        existingProject.setName(projectDTO.getName());
        existingProject.setDescription(projectDTO.getDescription());
        existingProject.setStartDate(projectDTO.getStartDate());
        existingProject.setEndDate(projectDTO.getEndDate());
        existingProject.setStatus(projectDTO.getStatus());
        existingProject.setLeaderId(projectDTO.getLeaderId());

        Project updatedProject = projectRepository.save(existingProject);
        return convertToDTO(updatedProject);
    }

    @Transactional
    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new RuntimeException("Project not found with id: " + id);
        }
        projectRepository.deleteById(id);
    }

    private ProjectDTO convertToDTO(Project project) {
        return ProjectDTO.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .status(project.getStatus())
                .leaderId(project.getLeaderId())
                .build();
    }

    private Project convertToEntity(ProjectDTO projectDTO) {
        return Project.builder()
                .name(projectDTO.getName())
                .description(projectDTO.getDescription())
                .startDate(projectDTO.getStartDate())
                .endDate(projectDTO.getEndDate())
                .status(projectDTO.getStatus())
                .leaderId(projectDTO.getLeaderId())
                .build();
    }
}