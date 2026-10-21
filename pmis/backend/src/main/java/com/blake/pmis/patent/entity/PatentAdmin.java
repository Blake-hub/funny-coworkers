package com.blake.pmis.patent.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Module-level patent admin grant. A user listed here (or any global ADMIN)
 * may maintain patent statuses, upload notices and undo transitions.
 */
@Entity
@Table(name = "patent_admin")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentAdmin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "granted_by", nullable = false)
    private Long grantedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
