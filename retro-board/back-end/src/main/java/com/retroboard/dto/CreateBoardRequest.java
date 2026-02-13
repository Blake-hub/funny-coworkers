package com.retroboard.dto;

import lombok.Data;

@Data
public class CreateBoardRequest {
    private String name;
    private String description;
    private Long teamId;
}
