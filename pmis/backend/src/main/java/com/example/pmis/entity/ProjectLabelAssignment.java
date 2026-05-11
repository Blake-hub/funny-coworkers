package com.example.pmis.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "project_label_assignments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectLabelAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "label_id", nullable = false)
    private Long labelId;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime assignedAt = LocalDateTime.now();
}