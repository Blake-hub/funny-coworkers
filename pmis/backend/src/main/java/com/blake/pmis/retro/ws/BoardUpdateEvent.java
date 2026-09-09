package com.blake.pmis.retro.ws;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardUpdateEvent {
    private String type;
    private Long boardId;
    private Object data;
    private LocalDateTime timestamp;
}
