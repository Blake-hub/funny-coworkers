package com.example.pmis.repository;

import com.example.pmis.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
    List<Milestone> findByProjectId(Long projectId);
    long countByProjectIdAndCompleted(Long projectId, Boolean completed);
    void deleteByProjectId(Long projectId);
}