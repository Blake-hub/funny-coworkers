package com.retroboard.service;

import com.retroboard.dto.BoardUpdateEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketService.class);
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;
    
    public void broadcastBoardUpdate(String eventType, Long boardId, Object data) {
        BoardUpdateEvent event = new BoardUpdateEvent();
        event.setType(eventType);
        event.setBoardId(boardId);
        event.setData(data);
        event.setTimestamp(System.currentTimeMillis());
        
        String destination = "/topic/board/" + boardId;
        logger.info("Broadcasting event {} to {}", eventType, destination);
        logger.info("Event data: {}", data);
        messagingTemplate.convertAndSend(destination, event);
    }
}
