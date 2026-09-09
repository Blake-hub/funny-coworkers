package com.blake.pmis.retro.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateColumnRequest {
    private String name;
    private Long boardId;
}
