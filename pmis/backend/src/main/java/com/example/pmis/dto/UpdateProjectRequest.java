package com.example.pmis.dto;

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
public class UpdateProjectRequest {

    @Size(max = 255, message = "Name must be less than 255 characters")
    private String name;

    @Size(max = 500, message = "Summary must be less than 500 characters")
    private String summary;

    private String description;

    private Integer status;

    private Integer priority;

    private Long leaderId;

    private LocalDate startDate;

    private LocalDate endDate;

    private Integer progress;
}