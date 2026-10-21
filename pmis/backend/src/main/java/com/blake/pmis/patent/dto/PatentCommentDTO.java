package com.blake.pmis.patent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Patent comment: system-generated records and manual comments share one stream. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentCommentDTO {

    private Long id;
    private Boolean isSystem;
    private Long authorId;
    private String authorName;
    private String content;
    private LocalDateTime createdAt;
}
