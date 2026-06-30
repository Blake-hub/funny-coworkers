package com.retroboard.dto;

import lombok.Data;

@Data
public class UpdateCardRequest {
    private String description;
    private Long columnId;
    private Integer position;
}
