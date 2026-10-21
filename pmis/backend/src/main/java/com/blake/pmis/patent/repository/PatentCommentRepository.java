package com.blake.pmis.patent.repository;

import com.blake.pmis.patent.entity.PatentComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatentCommentRepository extends JpaRepository<PatentComment, Long> {

    /** Mixed stream (system records + manual comments), newest first. */
    List<PatentComment> findByPatentIdOrderByCreatedAtDescIdDesc(Long patentId);
}
