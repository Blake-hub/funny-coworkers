package com.example.pmis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LabelDTO {

    private Long id;

    private String name;

    private String color;

    private String description;

    private LocalDateTime createdAt;
}