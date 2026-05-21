package com.example.pmis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueStatusDefinitionDTO {
    private Long id;
    private String name;
    private String color;
    private Integer displayOrder;
    private Boolean isActive;
}