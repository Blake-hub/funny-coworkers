package com.blake.pmis.patent.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "patent_comment")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patent_id", nullable = false)
    private Long patentId;

    /** NULL for system-generated records. */
    @Column(name = "author_id")
    private Long authorId;

    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean isSystem = false;

    /** Rendered text written at record time; kept as data (not i18n) so history stays stable. */
    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isSystem == null) {
            isSystem = false;
        }
    }
}
