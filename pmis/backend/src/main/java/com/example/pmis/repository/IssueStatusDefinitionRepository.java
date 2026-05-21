package com.example.pmis.repository;

import com.example.pmis.entity.IssueStatusDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueStatusDefinitionRepository extends JpaRepository<IssueStatusDefinition, Long> {

    List<IssueStatusDefinition> findAllByIsActiveTrueOrderByDisplayOrderAsc();

    List<IssueStatusDefinition> findAllByOrderByDisplayOrderAsc();

    @Modifying
    @Query("UPDATE IssueStatusDefinition s SET s.displayOrder = :order WHERE s.id = :id")
    void updateDisplayOrder(@Param("id") Long id, @Param("order") Integer order);

    boolean existsByName(String name);
}