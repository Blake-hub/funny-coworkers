package com.example.pmis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueDTO {

    private Long id;

    @NotBlank(message = "Type is required")
    @Size(max = 50, message = "Type must be less than 50 characters")
    private String type;

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be less than 200 characters")
    private String title;

    @Size(max = 1000, message = "Description must be less than 1000 characters")
    private String description;

    @NotBlank(message = "Status is required")
    @Size(max = 50, message = "Status must be less than 50 characters")
    private String status;

    @NotBlank(message = "Priority is required")
    @Size(max = 50, message = "Priority must be less than 50 characters")
    private String priority;

    private LocalDate dueDate;

    private Long assigneeId;

    private Long projectId;

    private Long parentId;

    private Long rootId;

    private String labels;

    private Integer storyPoints;

    @Size(max = 50, message = "Severity must be less than 50 characters")
    private String severity;

    @Size(max = 1000, message = "Acceptance criteria must be less than 1000 characters")
    private String acceptanceCriteria;
}