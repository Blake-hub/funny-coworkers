package com.retroboard.controller;

import com.retroboard.entity.Card;
import com.retroboard.service.CardService;
import com.retroboard.dto.CreateCardRequest;
import com.retroboard.dto.UpdateCardRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/cards")
public class CardController {
    
    @Autowired
    private CardService cardService;
    
    // Create a new card
    @PostMapping
    public ResponseEntity<Card> createCard(@RequestBody CreateCardRequest request) {
        Card card = cardService.createCard(request);
        return new ResponseEntity<>(card, HttpStatus.CREATED);
    }
    
    // Delete a card
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCard(@PathVariable Long id) {
        cardService.deleteCard(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    // Query all cards for a column
    @GetMapping("/column/{columnId}")
    public ResponseEntity<List<Card>> getAllCards(@PathVariable Long columnId) {
        List<Card> cards = cardService.getAllCards(columnId);
        return new ResponseEntity<>(cards, HttpStatus.OK);
    }
    
    // Update a card
    @PutMapping("/{id}")
    public ResponseEntity<Card> updateCard(@PathVariable Long id, @RequestBody UpdateCardRequest request) {
        Card updatedCard = cardService.updateCard(id, request);
        return new ResponseEntity<>(updatedCard, HttpStatus.OK);
    }
    
    // Get a card by id
    @GetMapping("/{id}")
    public ResponseEntity<Card> getCardById(@PathVariable Long id) {
        Card card = cardService.getCardById(id);
        return new ResponseEntity<>(card, HttpStatus.OK);
    }
}
