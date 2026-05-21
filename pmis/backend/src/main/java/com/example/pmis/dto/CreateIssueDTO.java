package com.example.pmis.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateIssueDTO {
    private Long projectId;
    private String title;
    private String description;
    private Integer statusId;
    private Long assigneeId;
    private Long reporterId;
    private Integer priorityId;
}