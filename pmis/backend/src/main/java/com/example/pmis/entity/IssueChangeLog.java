package com.example.pmis.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "issue_change_log")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueChangeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "issue_id", nullable = false)
    private Long issueId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "field_changed", nullable = false, length = 50)
    private String fieldChanged;

    @Column(name = "old_value", length = 255)
    private String oldValue;

    @Column(name = "new_value", length = 255)
    private String newValue;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }
}