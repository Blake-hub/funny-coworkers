package com.example.pmis.repository;

import com.example.pmis.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByLeaderId(Long leaderId);
    List<Project> findByStatus(Integer status);
    List<Project> findByPriority(Integer priority);
}