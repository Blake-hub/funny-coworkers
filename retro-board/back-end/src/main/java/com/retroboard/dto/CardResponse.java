package com.retroboard.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CardResponse {
    private Long id;
    private String title;
    private String description;
    private Integer position;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer votes;
    private ColumnSimpleResponse column;
}
