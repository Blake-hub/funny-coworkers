package com.retroboard.service;

import com.retroboard.dto.BoardUpdateEvent;
import com.retroboard.entity.Card;
import com.retroboard.entity.BoardColumn;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WebSocketServiceTest {
    
    @Mock
    private SimpMessagingTemplate messagingTemplate;
    
    @InjectMocks
    private WebSocketService webSocketService;
    
    private BoardColumn column;
    private Card card;
    
    @BeforeEach
    void setUp() {
        column = new BoardColumn();
        column.setId(1L);
        column.setName("Test Column");
        
        card = new Card();
        card.setId(1L);
        card.setTitle("Test Card");
        card.setDescription("Test Description");
        card.setColumn(column);
        card.setPosition(0);
    }
    
    @Test
    void testBroadcastBoardUpdate_CardCreated() {
        String eventType = "card_created";
        Long boardId = 1L;
        
        webSocketService.broadcastBoardUpdate(eventType, boardId, card);
        
        String expectedDestination = "/topic/board/" + boardId;
        verify(messagingTemplate, times(1)).convertAndSend(eq(expectedDestination), any(BoardUpdateEvent.class));
    }
    
    @Test
    void testBroadcastBoardUpdate_CardUpdated() {
        String eventType = "card_updated";
        Long boardId = 1L;
        
        webSocketService.broadcastBoardUpdate(eventType, boardId, card);
        
        String expectedDestination = "/topic/board/" + boardId;
        verify(messagingTemplate, times(1)).convertAndSend(eq(expectedDestination), any(BoardUpdateEvent.class));
    }
    
    @Test
    void testBroadcastBoardUpdate_CardDeleted() {
        String eventType = "card_deleted";
        Long boardId = 1L;
        Long cardId = 1L;
        
        webSocketService.broadcastBoardUpdate(eventType, boardId, cardId);
        
        String expectedDestination = "/topic/board/" + boardId;
        verify(messagingTemplate, times(1)).convertAndSend(eq(expectedDestination), any(BoardUpdateEvent.class));
    }
    
    @Test
    void testBroadcastBoardUpdate_ColumnCreated() {
        String eventType = "column_created";
        Long boardId = 1L;
        
        webSocketService.broadcastBoardUpdate(eventType, boardId, column);
        
        String expectedDestination = "/topic/board/" + boardId;
        verify(messagingTemplate, times(1)).convertAndSend(eq(expectedDestination), any(BoardUpdateEvent.class));
    }
    
    @Test
    void testBroadcastBoardUpdate_ColumnUpdated() {
        String eventType = "column_updated";
        Long boardId = 1L;
        
        webSocketService.broadcastBoardUpdate(eventType, boardId, column);
        
        String expectedDestination = "/topic/board/" + boardId;
        verify(messagingTemplate, times(1)).convertAndSend(eq(expectedDestination), any(BoardUpdateEvent.class));
    }
    
    @Test
    void testBroadcastBoardUpdate_ColumnDeleted() {
        String eventType = "column_deleted";
        Long boardId = 1L;
        Long columnId = 1L;
        
        webSocketService.broadcastBoardUpdate(eventType, boardId, columnId);
        
        String expectedDestination = "/topic/board/" + boardId;
        verify(messagingTemplate, times(1)).convertAndSend(eq(expectedDestination), any(BoardUpdateEvent.class));
    }
    
    @Test
    void testBroadcastBoardUpdate_CardVoted() {
        String eventType = "card_voted";
        Long boardId = 1L;
        
        webSocketService.broadcastBoardUpdate(eventType, boardId, card);
        
        String expectedDestination = "/topic/board/" + boardId;
        verify(messagingTemplate, times(1)).convertAndSend(eq(expectedDestination), any(BoardUpdateEvent.class));
    }
}