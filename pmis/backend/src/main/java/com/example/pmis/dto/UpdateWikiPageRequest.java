package com.example.pmis.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWikiPageRequest {

    @Size(max = 200, message = "Title must be less than 200 characters")
    private String title;

    private String contentHtml;

    private String contentJson;

    private Long parentPageId;

    private Boolean isPublished;

    private Long teamId;
}
