package com.example.pmis.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "issue")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(nullable = false, length = 50)
    private String priority;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "assignee_id")
    private Long assigneeId;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "parent_id")
    private Long parentId;

    @Column(name = "root_id")
    private Long rootId;

    @Column(columnDefinition = "json")
    private String labels;

    @Column(name = "story_points")
    private Integer storyPoints;

    @Column(length = 50)
    private String severity;

    @Column(name = "acceptance_criteria", length = 1000)
    private String acceptanceCriteria;
}