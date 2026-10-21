package com.blake.pmis.patent.repository;

import com.blake.pmis.patent.entity.PatentStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatentStatusHistoryRepository extends JpaRepository<PatentStatusHistory, Long> {

    /** Full history (including undone rows), newest first. */
    List<PatentStatusHistory> findByPatentIdOrderByCreatedAtDescIdDesc(Long patentId);

    /** Latest transition that has not been undone; empty when the patent has no live transition. */
    Optional<PatentStatusHistory> findFirstByPatentIdAndUndoneFalseOrderByCreatedAtDescIdDesc(Long patentId);
}
