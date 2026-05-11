package com.example.pmis.repository;

import com.example.pmis.entity.LabelDefinition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LabelDefinitionRepository extends JpaRepository<LabelDefinition, Long> {
    Optional<LabelDefinition> findByName(String name);
    boolean existsByName(String name);
}