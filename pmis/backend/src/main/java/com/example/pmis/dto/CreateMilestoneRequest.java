package com.example.pmis.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateMilestoneRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    private LocalDate dueDate;
}