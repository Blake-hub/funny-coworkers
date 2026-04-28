package com.example.pmis.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "wiki_page")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WikiPage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "text")
    private String content;

    @Column(name = "parent_page_id")
    private Long parentPageId;

    @Column(name = "last_modified_by")
    private Long lastModifiedBy;

    @Column(name = "last_modified_at", nullable = false)
    private LocalDateTime lastModifiedAt;

    @PrePersist
    protected void onCreate() {
        lastModifiedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        lastModifiedAt = LocalDateTime.now();
    }
}