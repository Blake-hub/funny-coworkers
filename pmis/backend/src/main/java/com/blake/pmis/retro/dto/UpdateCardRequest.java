package com.blake.pmis.retro.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCardRequest {
    private String title;
    private String description;
    private Long columnId;
    private Integer position;
}
