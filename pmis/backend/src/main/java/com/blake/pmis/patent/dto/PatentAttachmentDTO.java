package com.blake.pmis.patent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Visible patent attachment. Disclosure rows are removed server-side for unauthorized viewers. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentAttachmentDTO {

    private Long id;
    private String category;
    private String fileName;
    private Long fileSize;
    private String contentType;
    private Long uploadedBy;
    private String uploadedByName;
    private LocalDateTime uploadedAt;
    private Long historyId;
}
