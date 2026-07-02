package com.example.pmis.entity;

import com.example.pmis.entity.enumeration.WikiVisibility;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "wiki_folder")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WikiFolder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "parent_folder_id")
    private Long parentFolderId;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    @Builder.Default
    private WikiVisibility visibility = WikiVisibility.PRIVATE;

    @Column(name = "team_id")
    private Long teamId;

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (visibility == null) {
            visibility = WikiVisibility.PRIVATE;
        }
    }
}
