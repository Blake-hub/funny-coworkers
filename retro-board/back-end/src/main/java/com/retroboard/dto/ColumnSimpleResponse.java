package com.retroboard.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ColumnSimpleResponse {
    private Long id;
    private String name;
}
