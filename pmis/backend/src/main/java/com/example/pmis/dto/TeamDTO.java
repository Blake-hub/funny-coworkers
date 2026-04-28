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
public class TeamDTO {

    private Long id;

    @NotBlank(message = "Identifier is required")
    @Size(max = 50, message = "Identifier must be less than 50 characters")
    private String identifier;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;

    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;

    private Integer memberCount;

    @Size(max = 100, message = "Lead name must be less than 100 characters")
    private String leadName;
}