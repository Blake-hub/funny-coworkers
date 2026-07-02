package com.example.pmis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WikiFolderDTO {
    private Long id;
    private String name;
    private Long parentFolderId;
    private String visibility;
    private Long teamId;
    private String teamName;
    private Long createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private Long pageCount;
    private List<WikiFolderDTO> children;
}
