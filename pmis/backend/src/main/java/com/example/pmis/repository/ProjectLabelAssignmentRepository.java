package com.example.pmis.repository;

import com.example.pmis.entity.ProjectLabelAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectLabelAssignmentRepository extends JpaRepository<ProjectLabelAssignment, Long> {
    List<ProjectLabelAssignment> findByProjectId(Long projectId);
    List<ProjectLabelAssignment> findByLabelId(Long labelId);
    Optional<ProjectLabelAssignment> findByProjectIdAndLabelId(Long projectId, Long labelId);
    void deleteByProjectId(Long projectId);
    void deleteByLabelId(Long labelId);
    boolean existsByProjectIdAndLabelId(Long projectId, Long labelId);
}