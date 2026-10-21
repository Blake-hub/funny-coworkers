package com.blake.pmis.patent.repository;

import com.blake.pmis.patent.entity.PatentApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PatentApplicationRepository extends JpaRepository<PatentApplication, Long> {

    /** Full list ordered by application date desc (no pagination by design). */
    List<PatentApplication> findAllByOrderBySubmitDateDescIdDesc();

    List<PatentApplication> findByCreatorIdOrderBySubmitDateDescIdDesc(Long creatorId);

    List<PatentApplication> findByStatusOrderBySubmitDateDescIdDesc(
            com.blake.pmis.entity.enumeration.PatentStatus status);

    /**
     * Search across title + inventors + application number (case-insensitive).
     * Scope filters are combined with the keyword.
     * Optional filters are guarded by flags so that no NULL bind parameter reaches
     * PostgreSQL, which cannot infer a type for it (lower(bytea) error).
     */
    @Query("""
            SELECT p FROM PatentApplication p
            WHERE (:hasKeyword = FALSE
                   OR LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(p.inventors) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(p.applicationNumber) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:hasCreator = FALSE OR p.creatorId = :creatorId)
              AND (:hasStatus = FALSE OR p.status = :status)
            ORDER BY p.submitDate DESC, p.id DESC
            """)
    List<PatentApplication> search(
            @Param("hasKeyword") boolean hasKeyword,
            @Param("keyword") String keyword,
            @Param("hasCreator") boolean hasCreator,
            @Param("creatorId") Long creatorId,
            @Param("hasStatus") boolean hasStatus,
            @Param("status") com.blake.pmis.entity.enumeration.PatentStatus status);
}
