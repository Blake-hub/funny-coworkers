package com.blake.pmis.patent.entity;

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
@Table(name = "patent_status_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentStatusHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patent_id", nullable = false)
    private Long patentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_status", nullable = false, length = 30)
    private PatentStatus fromStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_status", nullable = false, length = 30)
    private PatentStatus toStatus;

    /** Stage date confirmed by the operator (defaults to today, may be backfilled). */
    @Column(name = "event_date", nullable = false)
    private LocalDate eventDate;

    @Column(name = "operator_id", nullable = false)
    private Long operatorId;

    /** Snapshot of the application number set by this transition; used for precise undo. */
    @Column(name = "application_number", length = 100)
    private String applicationNumber;

    /** Snapshot of the certificate number set by this transition; used for precise undo. */
    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;

    /** Snapshot of the application type confirmed at transition to PAID; used for precise undo. */
    @Enumerated(EnumType.STRING)
    @Column(name = "application_type", length = 20)
    private PatentType applicationType;

    @Column(name = "undone", nullable = false)
    @Builder.Default
    private Boolean undone = false;

    @Column(name = "undone_at")
    private LocalDateTime undoneAt;

    @Column(name = "undone_by")
    private Long undoneBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (undone == null) {
            undone = false;
        }
    }
}
