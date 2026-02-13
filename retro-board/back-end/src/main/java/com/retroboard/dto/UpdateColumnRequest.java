package com.retroboard.dto;

import lombok.Data;

@Data
public class UpdateColumnRequest {
    private String name;
    private Integer position;
}
