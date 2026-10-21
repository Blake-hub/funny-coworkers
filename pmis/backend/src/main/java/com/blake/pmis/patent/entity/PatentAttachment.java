package com.blake.pmis.patent.entity;

import com.blake.pmis.entity.enumeration.PatentAttachmentCategory;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "patent_attachment")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patent_id", nullable = false)
    private Long patentId;

    /** Non-null when uploaded as part of a status transition; used to hide attachments on undo. */
    @Column(name = "history_id")
    private Long historyId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PatentAttachmentCategory category;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    /** Storage path relative to the upload dir. */
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    @Column(name = "uploaded_by", nullable = false)
    private Long uploadedBy;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    /** Set to true on undo; the file itself is kept on disk. */
    @Column(name = "hidden", nullable = false)
    @Builder.Default
    private Boolean hidden = false;

    @PrePersist
    protected void onCreate() {
        uploadedAt = LocalDateTime.now();
        if (hidden == null) {
            hidden = false;
        }
    }
}
