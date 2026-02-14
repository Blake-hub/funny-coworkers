package com.retroboard.service;

import com.retroboard.entity.Card;
import com.retroboard.entity.BoardColumn;
import com.retroboard.entity.CardVote;
import com.retroboard.entity.User;
import com.retroboard.repository.CardRepository;
import com.retroboard.repository.BoardColumnRepository;
import com.retroboard.repository.CardVoteRepository;
import com.retroboard.repository.UserRepository;
import com.retroboard.dto.CreateCardRequest;
import com.retroboard.dto.UpdateCardRequest;
import com.retroboard.dto.CardResponse;
import com.retroboard.dto.ColumnSimpleResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class CardService {
    
    private static final Logger logger = LoggerFactory.getLogger(CardService.class);
    
    private CardResponse convertCardToResponse(Card card) {
        CardResponse response = new CardResponse();
        response.setId(card.getId());
        response.setTitle(card.getTitle());
        response.setDescription(card.getDescription());
        response.setPosition(card.getPosition());
        response.setCreatedAt(card.getCreatedAt());
        response.setUpdatedAt(card.getUpdatedAt());
        response.setVotes(card.getVotes());
        
        ColumnSimpleResponse columnSimple = new ColumnSimpleResponse();
        columnSimple.setId(card.getColumn().getId());
        columnSimple.setName(card.getColumn().getName());
        response.setColumn(columnSimple);
        
        return response;
    }
    
    @Autowired
    private CardRepository cardRepository;
    
    @Autowired
    private BoardColumnRepository columnRepository;
    
    @Autowired
    private BoardColumnService columnService;
    
    @Autowired
    private CardVoteRepository cardVoteRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private WebSocketService webSocketService;
    
    // Get current authenticated user
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        // Check if user is authenticated
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new RuntimeException("User not authenticated");
        }
        
        Object principal = authentication.getPrincipal();
        String username;
        if (principal instanceof UserDetails) {
            username = ((UserDetails) principal).getUsername();
        } else {
            username = principal.toString();
        }
        
        logger.debug("Trying to find user with username: {}", username);
        
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found: " + username));
    }
    
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
        
        Card savedCard = cardRepository.save(card);
        
        // Broadcast event
        Long boardId = column.getBoard().getId();
        CardResponse cardResponse = convertCardToResponse(savedCard);
        webSocketService.broadcastBoardUpdate("card_created", boardId, cardResponse);
        
        return savedCard;
    }
    
    @Transactional
    public void deleteCard(Long cardId) {
        // Get the card
        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new RuntimeException("Card not found"));
        
        // Check column access (via BoardColumnService)
        columnService.getColumnById(card.getColumn().getId());
        
        // Get board ID before deleting
        Long boardId = card.getColumn().getBoard().getId();
        
        // Delete the card
        cardRepository.delete(card);
        
        // Broadcast event
        webSocketService.broadcastBoardUpdate("card_deleted", boardId, cardId);
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
        
        // Get board ID
        Long boardId = card.getColumn().getBoard().getId();
        
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
        
        Card updatedCard = cardRepository.save(card);
        
        // Broadcast event
        CardResponse cardResponse = convertCardToResponse(updatedCard);
        webSocketService.broadcastBoardUpdate("card_updated", boardId, cardResponse);
        
        return updatedCard;
    }
    
    public Card getCardById(Long cardId) {
        // Get the card
        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new RuntimeException("Card not found"));
        
        // Check column access (via BoardColumnService)
        columnService.getColumnById(card.getColumn().getId());
        
        return card;
    }
    
    @Transactional
    public Card voteCard(Long cardId) {
        // Get the card
        Card card = cardRepository.findById(cardId)
            .orElseThrow(() -> new RuntimeException("Card not found"));
        
        // Check column access (via BoardColumnService)
        columnService.getColumnById(card.getColumn().getId());
        
        // Get board ID
        Long boardId = card.getColumn().getBoard().getId();
        
        // Get current user
        User currentUser = getCurrentUser();
        
        // Check if user already voted
        if (cardVoteRepository.existsByUserAndCard(currentUser, card)) {
            // User already voted - remove the vote
            cardVoteRepository.deleteByUserAndCard(currentUser, card);
            card.setVotes(Math.max(0, card.getVotes() - 1));
            logger.debug("User {} removed vote from card {}", currentUser.getUsername(), cardId);
        } else {
            // User hasn't voted - add the vote
            CardVote cardVote = new CardVote();
            cardVote.setUser(currentUser);
            cardVote.setCard(card);
            cardVoteRepository.save(cardVote);
            card.setVotes(card.getVotes() + 1);
            logger.debug("User {} voted for card {}", currentUser.getUsername(), cardId);
        }
        
        Card updatedCard = cardRepository.save(card);
        
        logger.info("Vote updated for card {}, broadcasting update...", cardId);
        
        // Broadcast event
        CardResponse cardResponse = convertCardToResponse(updatedCard);
        webSocketService.broadcastBoardUpdate("card_voted", boardId, cardResponse);
        
        return updatedCard;
    }
}
