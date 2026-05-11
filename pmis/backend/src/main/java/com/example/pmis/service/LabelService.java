package com.example.pmis.service;

import com.example.pmis.dto.CreateLabelRequest;
import com.example.pmis.dto.LabelDTO;
import com.example.pmis.entity.LabelDefinition;
import com.example.pmis.entity.Project;
import com.example.pmis.entity.ProjectLabelAssignment;
import com.example.pmis.repository.LabelDefinitionRepository;
import com.example.pmis.repository.ProjectLabelAssignmentRepository;
import com.example.pmis.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LabelService {

    private final LabelDefinitionRepository labelDefinitionRepository;
    private final ProjectLabelAssignmentRepository projectLabelAssignmentRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<LabelDTO> getAllLabels() {
        return labelDefinitionRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LabelDTO getLabelById(Long id) {
        LabelDefinition label = labelDefinitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Label not found with id: " + id));
        return convertToDTO(label);
    }

    @Transactional
    public LabelDTO createLabel(CreateLabelRequest request) {
        if (labelDefinitionRepository.existsByName(request.getName())) {
            throw new RuntimeException("Label name already exists: " + request.getName());
        }
        LabelDefinition label = LabelDefinition.builder()
                .name(request.getName())
                .color(request.getColor() != null ? request.getColor() : "#6b7280")
                .description(request.getDescription())
                .build();
        LabelDefinition savedLabel = labelDefinitionRepository.save(label);
        return convertToDTO(savedLabel);
    }

    @Transactional
    public LabelDTO updateLabel(Long id, CreateLabelRequest request) {
        LabelDefinition label = labelDefinitionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Label not found with id: " + id));

        if (!label.getName().equals(request.getName()) && labelDefinitionRepository.existsByName(request.getName())) {
            throw new RuntimeException("Label name already exists: " + request.getName());
        }

        label.setName(request.getName());
        if (request.getColor() != null) {
            label.setColor(request.getColor());
        }
        label.setDescription(request.getDescription());

        LabelDefinition updatedLabel = labelDefinitionRepository.save(label);
        return convertToDTO(updatedLabel);
    }

    @Transactional
    public void deleteLabel(Long id) {
        if (!labelDefinitionRepository.existsById(id)) {
            throw new RuntimeException("Label not found with id: " + id);
        }
        projectLabelAssignmentRepository.deleteByLabelId(id);
        labelDefinitionRepository.deleteById(id);
    }

    @Transactional
    public void assignLabelToProject(Long projectId, Long labelId) {
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
    public void removeLabelFromProject(Long projectId, Long labelId) {
        ProjectLabelAssignment assignment = projectLabelAssignmentRepository
                .findByProjectIdAndLabelId(projectId, labelId)
                .orElseThrow(() -> new RuntimeException("Label assignment not found"));
        projectLabelAssignmentRepository.delete(assignment);
    }

    private LabelDTO convertToDTO(LabelDefinition label) {
        return LabelDTO.builder()
                .id(label.getId())
                .name(label.getName())
                .color(label.getColor())
                .description(label.getDescription())
                .createdAt(label.getCreatedAt())
                .build();
    }
}