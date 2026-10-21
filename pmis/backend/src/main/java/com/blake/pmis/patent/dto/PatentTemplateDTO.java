package com.blake.pmis.patent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentTemplateDTO {
    private Long id;
    private String fileName;
    private Long fileSize;
    private String contentType;
    private String uploadedByName;
    private LocalDateTime uploadedAt;
}
