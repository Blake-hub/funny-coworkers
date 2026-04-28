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
public class ProjectDTO {

    private Long id;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;

    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    @NotBlank(message = "Status is required")
    @Size(max = 50, message = "Status must be less than 50 characters")
    private String status;

    private Long leaderId;
}