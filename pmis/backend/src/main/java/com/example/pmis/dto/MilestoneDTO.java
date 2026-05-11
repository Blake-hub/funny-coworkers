package com.example.pmis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MilestoneDTO {

    private Long id;

    private Long projectId;

    private String name;

    private String description;

    private LocalDate dueDate;

    private Boolean completed;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}