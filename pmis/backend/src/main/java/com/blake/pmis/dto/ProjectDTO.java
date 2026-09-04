package com.blake.pmis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDTO {

    private Long id;

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must be less than 255 characters")
    private String name;

    @Size(max = 500, message = "Summary must be less than 500 characters")
    private String summary;

    private String description;

    @Builder.Default
    private Integer status = 1;

    private String statusLabel;

    @Builder.Default
    private Integer priority = 0;

    private String priorityLabel;

    @NotNull(message = "Leader ID is required")
    private Long leaderId;

    private String leaderName;

    private LocalDate startDate;

    private LocalDate endDate;

    @Builder.Default
    private Integer progress = 0;

    private Integer memberCount;

    private Integer issueCount;

    private Integer openIssues;

    private List<LabelDTO> labels;

    private List<MilestoneDTO> milestones;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}