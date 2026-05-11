package com.example.pmis.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_members")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 50)
    private String role;

    @Column(name = "joined_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime joinedAt = LocalDateTime.now();
}