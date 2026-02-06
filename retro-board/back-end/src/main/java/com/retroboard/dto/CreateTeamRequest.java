package com.retroboard.dto;

import lombok.Data;

@Data
public class CreateTeamRequest {
    private String name;
    private Long ownerId;
}
