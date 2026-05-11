package com.example.pmis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLabelRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 50, message = "Name must be less than 50 characters")
    private String name;

    @Size(max = 7, message = "Color must be a valid hex code")
    private String color;

    @Size(max = 255, message = "Description must be less than 255 characters")
    private String description;
}