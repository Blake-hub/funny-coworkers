package com.example.pmis.repository;

import com.example.pmis.entity.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findByAssigneeId(Long assigneeId);
    List<Issue> findByProjectId(Long projectId);
    List<Issue> findByType(String type);
    List<Issue> findByStatus(String status);
    List<Issue> findByPriority(String priority);
    List<Issue> findByParentId(Long parentId);
    List<Issue> findByRootId(Long rootId);
    long countByProjectId(Long projectId);
    long countByProjectIdAndStatusNot(Long projectId, String status);
}