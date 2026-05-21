package com.example.pmis.service;

import com.example.pmis.dto.IssueStatusDefinitionDTO;
import com.example.pmis.entity.IssueStatusDefinition;
import com.example.pmis.repository.IssueStatusDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IssueStatusService {

    private final IssueStatusDefinitionRepository repository;

    @Transactional(readOnly = true)
    public List<IssueStatusDefinitionDTO> getAllStatusDefinitions() {
        return repository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IssueStatusDefinitionDTO> getActiveStatusDefinitions() {
        return repository.findAllByIsActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public IssueStatusDefinitionDTO createStatus(IssueStatusDefinitionDTO dto) {
        IssueStatusDefinition definition = IssueStatusDefinition.builder()
                .name(dto.getName())
                .color(dto.getColor())
                .displayOrder(dto.getDisplayOrder())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();
        IssueStatusDefinition saved = repository.save(definition);
        return convertToDTO(saved);
    }

    @Transactional
    public IssueStatusDefinitionDTO updateStatus(Long id, IssueStatusDefinitionDTO dto) {
        IssueStatusDefinition definition = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Status not found with id: " + id));

        if (dto.getName() != null) {
            definition.setName(dto.getName());
        }
        if (dto.getColor() != null) {
            definition.setColor(dto.getColor());
        }
        if (dto.getDisplayOrder() != null) {
            definition.setDisplayOrder(dto.getDisplayOrder());
        }
        if (dto.getIsActive() != null) {
            definition.setIsActive(dto.getIsActive());
        }

        IssueStatusDefinition saved = repository.save(definition);
        return convertToDTO(saved);
    }

    @Transactional
    public void deleteStatus(Long id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Status not found with id: " + id);
        }
        repository.deleteById(id);
    }

    @Transactional
    public void reorderStatuses(List<Long> statusIds) {
        for (int i = 0; i < statusIds.size(); i++) {
            repository.updateDisplayOrder(statusIds.get(i), i);
        }
    }

    private IssueStatusDefinitionDTO convertToDTO(IssueStatusDefinition entity) {
        return IssueStatusDefinitionDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .color(entity.getColor())
                .displayOrder(entity.getDisplayOrder())
                .isActive(entity.getIsActive())
                .build();
    }
}