package com.blake.pmis.patent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/** Full patent detail: base info + attachments + comments + history + allowed transitions. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentDetailDTO {

    private Long id;
    private String title;
    /** Applicant's original draft title — differs from title only after admin edits. */
    private String originalTitle;
    private List<String> inventors;
    private String applicationType;
    /** Statutory patent category name (INVENTION / UTILITY_MODEL / DESIGN). */
    private String patentCategory;
    private String status;
    private String applicationNumber;
    private String certificateNumber;
    private Long projectId;
    private Long creatorId;
    private String creatorName;

    private LocalDate submitDate;
    private LocalDate receivedDate;
    private LocalDate paidDate;
    private LocalDate acceptedDate;
    private LocalDate preliminaryPassedDate;
    private LocalDate publishedDate;
    private LocalDate priorityGrantedDate;
    private LocalDate substantiveExamDate;
    private LocalDate oaNotificationDate;
    private LocalDate grantFeePaidDate;
    private LocalDate grantedDate;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Requester-specific flags driving conditional UI rendering. */
    private Boolean viewerIsCreator;
    private Boolean viewerIsPatentAdmin;

    private List<AllowedTransitionDTO> allowedTransitions;
    private List<PatentAttachmentDTO> attachments;
    private List<PatentCommentDTO> comments;
    private List<PatentHistoryDTO> history;
}
