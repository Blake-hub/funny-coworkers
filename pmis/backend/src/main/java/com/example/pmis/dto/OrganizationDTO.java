package com.example.pmis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationDTO {

    private Long id;

    @NotBlank(message = "Organization name is required")
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;

    @Size(max = 500, message = "Description must be less than 500 characters")
    private String description;

    @Size(max = 255, message = "Website must be less than 255 characters")
    private String website;

    @Size(max = 500, message = "Logo URL must be less than 500 characters")
    private String logoUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}