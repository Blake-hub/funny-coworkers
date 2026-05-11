package com.example.pmis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProjectRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must be less than 255 characters")
    private String name;

    @Size(max = 500, message = "Summary must be less than 500 characters")
    private String summary;

    private String description;

    @Builder.Default
    private Integer status = 1;

    @Builder.Default
    private Integer priority = 0;

    @NotNull(message = "Leader ID is required")
    private Long leaderId;

    private List<Long> memberIds;

    private LocalDate startDate;

    private LocalDate endDate;

    private List<LabelAssignmentRequest> labels;

    private List<CreateMilestoneRequest> milestones;
}