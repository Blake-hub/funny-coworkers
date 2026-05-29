package com.example.pmis.repository;

import com.example.pmis.entity.TeamIssueCounter;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeamIssueCounterRepository extends JpaRepository<TeamIssueCounter, Long> {
    Optional<TeamIssueCounter> findByTeamId(Long teamId);
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM TeamIssueCounter t WHERE t.teamId = :teamId")
    Optional<TeamIssueCounter> findByTeamIdWithLock(@Param("teamId") Long teamId);
}