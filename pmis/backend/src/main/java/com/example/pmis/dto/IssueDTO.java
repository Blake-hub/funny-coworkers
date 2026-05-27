package com.example.pmis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueDTO {
    private Long id;
    private Long projectId;
    private Long teamId;
    private String teamIdentifier;
    private String title;
    private String description;
    private Integer statusId;
    private Integer sortOrder;
    private Long assigneeId;
    private String assigneeName;
    private Long reporterId;
    private String reporterName;
    private Integer priorityId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}