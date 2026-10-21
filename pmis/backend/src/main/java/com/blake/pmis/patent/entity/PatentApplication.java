package com.blake.pmis.patent.entity;

import com.blake.pmis.entity.enumeration.PatentCategory;
import com.blake.pmis.entity.enumeration.PatentStatus;
import com.blake.pmis.entity.enumeration.PatentType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patent_application")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    /** The applicant's original draft title (captured at creation, updated only on admin edits). */
    @Column(name = "original_title", nullable = false)
    private String originalTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "application_type", nullable = false, length = 20)
    private PatentType applicationType;

    /** Statutory patent category: INVENTION / UTILITY_MODEL / DESIGN. */
    @Enumerated(EnumType.STRING)
    @Column(name = "patent_category", nullable = false, length = 30)
    private PatentCategory patentCategory;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PatentStatus status;

    /** JSON string array of inventor names, e.g. ["Alice","Bob"]; at least 1 entry. */
    @Column(nullable = false, columnDefinition = "text")
    private String inventors;

    /** Set (required) when transitioning to ACCEPTED. */
    @Column(name = "application_number", length = 100)
    private String applicationNumber;

    /** Set (required) when transitioning to GRANTED. */
    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;

    /** Phase 2 placeholder: linked PMIS project; no FK for now. */
    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "creator_id", nullable = false)
    private Long creatorId;

    /** Application date; equals the creation time, recorded automatically. */
    @Column(name = "submit_date", nullable = false)
    private LocalDate submitDate;

    @Column(name = "received_date")
    private LocalDate receivedDate;

    @Column(name = "paid_date")
    private LocalDate paidDate;

    @Column(name = "accepted_date")
    private LocalDate acceptedDate;

    @Column(name = "preliminary_passed_date")
    private LocalDate preliminaryPassedDate;

    @Column(name = "published_date")
    private LocalDate publishedDate;

    @Column(name = "priority_granted_date")
    private LocalDate priorityGrantedDate;

    @Column(name = "substantive_exam_date")
    private LocalDate substantiveExamDate;

    @Column(name = "oa_notification_date")
    private LocalDate oaNotificationDate;

    @Column(name = "grant_fee_paid_date")
    private LocalDate grantFeePaidDate;

    @Column(name = "granted_date")
    private LocalDate grantedDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        if (submitDate == null) {
            submitDate = LocalDate.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
