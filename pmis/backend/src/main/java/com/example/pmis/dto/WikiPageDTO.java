package com.example.pmis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WikiPageDTO {
    private Long id;
    private String title;
    private String contentHtml;
    private String contentJson;
    private Long parentPageId;
    private Boolean isPublished;
    private Long teamId;
    private Long createdBy;
    private String createdByName;
    private Long lastModifiedBy;
    private String lastModifiedByName;
    private LocalDateTime lastModifiedAt;
}
