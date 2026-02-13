package com.retroboard.dto;

import lombok.Data;

@Data
public class CreateCardRequest {
    private String title;
    private String description;
    private Long columnId;
    private Integer position;
}
