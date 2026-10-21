package com.blake.pmis.patent.repository;

import com.blake.pmis.entity.enumeration.PatentAttachmentCategory;
import com.blake.pmis.patent.entity.PatentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PatentAttachmentRepository extends JpaRepository<PatentAttachment, Long> {

    /** Visible attachments of a patent (hidden rows excluded), newest first. */
    List<PatentAttachment> findByPatentIdAndHiddenFalseOrderByUploadedAtDescIdDesc(Long patentId);

    List<PatentAttachment> findByPatentIdAndHiddenFalseAndCategoryOrderByUploadedAtDescIdDesc(
            Long patentId, PatentAttachmentCategory category);

    Optional<PatentAttachment> findByIdAndPatentIdAndHiddenFalse(Long id, Long patentId);

    /** Attachments linked to a specific history row (regardless of hidden flag). */
    List<PatentAttachment> findByHistoryId(Long historyId);
}
