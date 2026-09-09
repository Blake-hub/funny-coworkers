package com.blake.pmis.retro.ws;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class WebSocketService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastBoardUpdate(String eventType, Long boardId, Object data) {
        BoardUpdateEvent event = BoardUpdateEvent.builder()
                .type(eventType)
                .boardId(boardId)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
        String destination = "/topic/retro/" + boardId;
        messagingTemplate.convertAndSend(destination, event);
    }
}
