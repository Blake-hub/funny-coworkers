package com.retroboard.service;

import com.retroboard.entity.Card;
import com.retroboard.entity.BoardColumn;
import com.retroboard.repository.CardRepository;
import com.retroboard.repository.BoardColumnRepository;
import com.retroboard.dto.CreateCardRequest;
import com.retroboard.dto.UpdateCardRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CardServiceTest {
    
    @Mock
    private CardRepository cardRepository;
    
    @Mock
    private BoardColumnRepository columnRepository;
    
    @Mock
    private BoardColumnService columnService;
    
    @InjectMocks
    private CardService cardService;
    
    private BoardColumn column;
    private BoardColumn newColumn;
    private Card card;
    private CreateCardRequest createCardRequest;
    private UpdateCardRequest updateCardRequest;
    
    @BeforeEach
    void setUp() {
        column = new BoardColumn();
        column.setId(1L);
        column.setName("Test Column");
        
        newColumn = new BoardColumn();
        newColumn.setId(2L);
        newColumn.setName("New Column");
        
        card = new Card();
        card.setId(1L);
        card.setTitle("Test Card");
        card.setDescription("Test Description");
        card.setColumn(column);
        card.setPosition(0);
        
        createCardRequest = new CreateCardRequest();
        createCardRequest.setTitle("Test Card");
        createCardRequest.setDescription("Test Description");
        createCardRequest.setColumnId(1L);
        createCardRequest.setPosition(0);
        
        updateCardRequest = new UpdateCardRequest();
        updateCardRequest.setTitle("Updated Card");
        updateCardRequest.setDescription("Updated Description");
        updateCardRequest.setPosition(1);
    }
    
    @Test
    void testCreateCard() {
        when(columnRepository.findById(1L)).thenReturn(Optional.of(column));
        when(columnService.getColumnById(1L)).thenReturn(column);
        when(cardRepository.save(any(Card.class))).thenReturn(card);
        
        Card createdCard = cardService.createCard(createCardRequest);
        
        assertNotNull(createdCard);
        assertEquals("Test Card", createdCard.getTitle());
        verify(cardRepository, times(1)).save(any(Card.class));
    }
    
    @Test
    void testCreateCard_ColumnNotFound() {
        when(columnRepository.findById(1L)).thenReturn(Optional.empty());
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            cardService.createCard(createCardRequest);
        });
        
        assertEquals("Column not found", exception.getMessage());
    }
    
    @Test
    void testDeleteCard() {
        when(cardRepository.findById(1L)).thenReturn(Optional.of(card));
        when(columnService.getColumnById(1L)).thenReturn(column);
        doNothing().when(cardRepository).delete(card);
        
        cardService.deleteCard(1L);
        
        verify(cardRepository, times(1)).delete(card);
    }
    
    @Test
    void testDeleteCard_CardNotFound() {
        when(cardRepository.findById(1L)).thenReturn(Optional.empty());
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            cardService.deleteCard(1L);
        });
        
        assertEquals("Card not found", exception.getMessage());
    }
    
    @Test
    void testGetAllCards() {
        when(columnService.getColumnById(1L)).thenReturn(column);
        when(columnRepository.findById(1L)).thenReturn(Optional.of(column));
        when(cardRepository.findByColumnOrderByPositionAsc(column)).thenReturn(List.of(card));
        
        List<Card> cards = cardService.getAllCards(1L);
        
        assertNotNull(cards);
        assertEquals(1, cards.size());
        assertEquals(card, cards.get(0));
    }
    
    @Test
    void testUpdateCard() {
        when(cardRepository.findById(1L)).thenReturn(Optional.of(card));
        when(columnService.getColumnById(1L)).thenReturn(column);
        when(cardRepository.save(any(Card.class))).thenReturn(card);
        
        Card updatedCard = cardService.updateCard(1L, updateCardRequest);
        
        assertNotNull(updatedCard);
        assertEquals("Updated Card", updatedCard.getTitle());
        verify(cardRepository, times(1)).save(any(Card.class));
    }
    
    @Test
    void testUpdateCard_ChangeColumn() {
        updateCardRequest.setColumnId(2L);
        
        when(cardRepository.findById(1L)).thenReturn(Optional.of(card));
        when(columnService.getColumnById(1L)).thenReturn(column);
        when(columnService.getColumnById(2L)).thenReturn(newColumn);
        when(columnRepository.findById(2L)).thenReturn(Optional.of(newColumn));
        when(cardRepository.save(any(Card.class))).thenReturn(card);
        
        Card updatedCard = cardService.updateCard(1L, updateCardRequest);
        
        assertNotNull(updatedCard);
        assertEquals(newColumn, updatedCard.getColumn());
        verify(cardRepository, times(1)).save(any(Card.class));
    }
    
    @Test
    void testUpdateCard_CardNotFound() {
        when(cardRepository.findById(1L)).thenReturn(Optional.empty());
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            cardService.updateCard(1L, updateCardRequest);
        });
        
        assertEquals("Card not found", exception.getMessage());
    }
    
    @Test
    void testGetCardById() {
        when(cardRepository.findById(1L)).thenReturn(Optional.of(card));
        when(columnService.getColumnById(1L)).thenReturn(column);
        
        Card foundCard = cardService.getCardById(1L);
        
        assertNotNull(foundCard);
        assertEquals(card, foundCard);
    }
    
    @Test
    void testGetCardById_CardNotFound() {
        when(cardRepository.findById(1L)).thenReturn(Optional.empty());
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            cardService.getCardById(1L);
        });
        
        assertEquals("Card not found", exception.getMessage());
    }
}
