package com.retroboard.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BoardUpdateEvent {
    private String type; // "card_created", "card_updated", "card_deleted", "card_voted", "column_created", "column_updated", "column_deleted"
    private Long boardId;
    private Object data;
    private Long timestamp;
}
