package com.retroboard.dto;

import lombok.Data;

@Data
public class CreateColumnRequest {
    private String name;
    private Long boardId;
    private Integer position;
}
