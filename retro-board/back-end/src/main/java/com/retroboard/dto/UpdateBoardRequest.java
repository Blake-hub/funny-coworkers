package com.retroboard.dto;

import lombok.Data;

@Data
public class UpdateBoardRequest {
    private String name;
    private String description;
}
