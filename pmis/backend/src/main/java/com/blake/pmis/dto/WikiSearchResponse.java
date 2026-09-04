package com.blake.pmis.dto;

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
public class WikiSearchResponse {
    private List<SearchResult> results;
    private long totalCount;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchResult {
        private Long id;
        private String title;
        private String snippet;
        private String matchField; // "TITLE" or "CONTENT"
        private int score;
        private LocalDateTime updatedAt;
        private String updatedByName;
    }
}
