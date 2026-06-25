package com.example.pmis.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWikiCommentRequest {

    @NotNull(message = "Wiki page ID is required")
    private Long wikiPageId;

    @NotBlank(message = "Comment content is required")
    private String content;
}