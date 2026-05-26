package com.example.pmis.repository;

import com.example.pmis.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    Optional<Team> findByIdentifier(String identifier);
    boolean existsByIdentifier(String identifier);
    boolean existsByIdAndOwnerId(Long id, Long ownerId);
}