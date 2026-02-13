package com.retroboard.service;

import com.retroboard.entity.Card;
import com.retroboard.entity.BoardColumn;
import com.retroboard.repository.CardRepository;
import com.retroboard.repository.BoardColumnRepository;
import com.retroboard.dto.CreateCardRequest;
import com.retroboard.dto.UpdateCardRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class CardService {
    
    @Autowired
    private CardRepository cardRepository;
    
    @Autowired
    private BoardColumnRepository columnRepository;
    
    @Autowired
    private BoardColumnService columnService;
    
    @Transactional
    public Card createCard(CreateCardRequest request) {
        // Get the column
        BoardColumn column = columnRepository.findById(request.getColumnId())
            .orElseThrow(() -> new RuntimeException("Column not found"));
        
        // Check column access (via BoardColumnService)
        columnService.getColumnById(column.getId());
        
        // Create the card
        Card card = new Card();
        card.setTitle(request.getTitle());
        card.setDescription(request.getDescription());
        card.setColumn(column);
        card.setPosition(request.getPosition());
        
        return cardRepository.save(card);
    }
    
    @Transactional
    public void deleteCard(Long cardId) {
        // Get the card
        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new RuntimeException("Card not found"));
        
        // Check column access (via BoardColumnService)
        columnService.getColumnById(card.getColumn().getId());
        
        // Delete the card
        cardRepository.delete(card);
    }
    
    public List<Card> getAllCards(Long columnId) {
        // Check column access (via BoardColumnService)
        columnService.getColumnById(columnId);
        
        // Get the column
        BoardColumn column = columnRepository.findById(columnId)
            .orElseThrow(() -> new RuntimeException("Column not found"));
        
        return cardRepository.findByColumnOrderByPositionAsc(column);
    }
    
    @Transactional
    public Card updateCard(Long cardId, UpdateCardRequest request) {
        // Get the card
        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new RuntimeException("Card not found"));
        
        // Check column access (via BoardColumnService)
        columnService.getColumnById(card.getColumn().getId());
        
        // If column is being changed, check access to the new column
        if (request.getColumnId() != null && !request.getColumnId().equals(card.getColumn().getId())) {
            columnService.getColumnById(request.getColumnId());
            BoardColumn newColumn = columnRepository.findById(request.getColumnId())
                .orElseThrow(() -> new RuntimeException("New column not found"));
            card.setColumn(newColumn);
        }
        
        // Update card fields if provided
        if (request.getTitle() != null) {
            card.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            card.setDescription(request.getDescription());
        }
        if (request.getPosition() != null) {
            card.setPosition(request.getPosition());
        }
        
        return cardRepository.save(card);
    }
    
    public Card getCardById(Long cardId) {
        // Get the card
        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new RuntimeException("Card not found"));
        
        // Check column access (via BoardColumnService)
        columnService.getColumnById(card.getColumn().getId());
        
        return card;
    }
}
