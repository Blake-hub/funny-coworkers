package com.blake.pmis.patent.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A downloadable disclosure template (.doc/.docx) uploaded by patent admins
 * and offered to all users on the patent creation page.
 */
@Entity
@Table(name = "patent_template")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Original file name shown to users. */
    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    /** Storage path relative to the patent upload root. */
    @Column(name = "stored_path", nullable = false, length = 500)
    private String storedPath;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "content_type", length = 200)
    private String contentType;

    @Column(name = "uploaded_by", nullable = false)
    private Long uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
    }
}
