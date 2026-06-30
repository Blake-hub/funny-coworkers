package com.retroboard.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CardResponse {
    private Long id;
    private String description;
    private Integer position;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer votes;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean votedByCurrentUser;
    private ColumnSimpleResponse column;
}
