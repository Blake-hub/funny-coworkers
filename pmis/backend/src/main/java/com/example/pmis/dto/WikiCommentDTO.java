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
public class WikiCommentDTO {

    private Long id;

    private Long wikiPageId;

    private Long userId;

    private String userName;

    private String content;

    private LocalDateTime createdAt;
}