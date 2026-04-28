package com.example.pmis.service;

import com.example.pmis.dto.IssueDTO;
import com.example.pmis.entity.Issue;
import com.example.pmis.repository.IssueRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;

    @Transactional(readOnly = true)
    public List<IssueDTO> getAllIssues() {
        return issueRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public IssueDTO getIssueById(Long id) {
        return issueRepository.findById(id)
                .map(this::convertToDTO)
                .orElseThrow(() -> new RuntimeException("Issue not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<IssueDTO> getIssuesByAssignee(Long assigneeId) {
        return issueRepository.findByAssigneeId(assigneeId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IssueDTO> getIssuesByProject(Long projectId) {
        return issueRepository.findByProjectId(projectId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public IssueDTO createIssue(IssueDTO issueDTO) {
        Issue issue = convertToEntity(issueDTO);
        Issue savedIssue = issueRepository.save(issue);
        return convertToDTO(savedIssue);
    }

    @Transactional
    public IssueDTO updateIssue(Long id, IssueDTO issueDTO) {
        Issue existingIssue = issueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Issue not found with id: " + id));

        existingIssue.setType(issueDTO.getType());
        existingIssue.setTitle(issueDTO.getTitle());
        existingIssue.setDescription(issueDTO.getDescription());
        existingIssue.setStatus(issueDTO.getStatus());
        existingIssue.setPriority(issueDTO.getPriority());
        existingIssue.setDueDate(issueDTO.getDueDate());
        existingIssue.setAssigneeId(issueDTO.getAssigneeId());
        existingIssue.setProjectId(issueDTO.getProjectId());
        existingIssue.setParentId(issueDTO.getParentId());
        existingIssue.setRootId(issueDTO.getRootId());
        existingIssue.setLabels(issueDTO.getLabels());
        existingIssue.setStoryPoints(issueDTO.getStoryPoints());
        existingIssue.setSeverity(issueDTO.getSeverity());
        existingIssue.setAcceptanceCriteria(issueDTO.getAcceptanceCriteria());

        Issue updatedIssue = issueRepository.save(existingIssue);
        return convertToDTO(updatedIssue);
    }

    @Transactional
    public void deleteIssue(Long id) {
        if (!issueRepository.existsById(id)) {
            throw new RuntimeException("Issue not found with id: " + id);
        }
        issueRepository.deleteById(id);
    }

    private IssueDTO convertToDTO(Issue issue) {
        return IssueDTO.builder()
                .id(issue.getId())
                .type(issue.getType())
                .title(issue.getTitle())
                .description(issue.getDescription())
                .status(issue.getStatus())
                .priority(issue.getPriority())
                .dueDate(issue.getDueDate())
                .assigneeId(issue.getAssigneeId())
                .projectId(issue.getProjectId())
                .parentId(issue.getParentId())
                .rootId(issue.getRootId())
                .labels(issue.getLabels())
                .storyPoints(issue.getStoryPoints())
                .severity(issue.getSeverity())
                .acceptanceCriteria(issue.getAcceptanceCriteria())
                .build();
    }

    private Issue convertToEntity(IssueDTO issueDTO) {
        return Issue.builder()
                .type(issueDTO.getType())
                .title(issueDTO.getTitle())
                .description(issueDTO.getDescription())
                .status(issueDTO.getStatus())
                .priority(issueDTO.getPriority())
                .dueDate(issueDTO.getDueDate())
                .assigneeId(issueDTO.getAssigneeId())
                .projectId(issueDTO.getProjectId())
                .parentId(issueDTO.getParentId())
                .rootId(issueDTO.getRootId())
                .labels(issueDTO.getLabels())
                .storyPoints(issueDTO.getStoryPoints())
                .severity(issueDTO.getSeverity())
                .acceptanceCriteria(issueDTO.getAcceptanceCriteria())
                .build();
    }
}