package com.blake.pmis.retro.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardDTO {
    private Long id;
    private String title;
    private String description;
    private Long columnId;
    private Long creatorId;
    private Integer position;
    private Integer votes;
    private Boolean votedByCurrentUser;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
