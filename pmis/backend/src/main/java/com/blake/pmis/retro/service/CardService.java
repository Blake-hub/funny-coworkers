package com.blake.pmis.retro.service;

import com.blake.pmis.entity.User;
import com.blake.pmis.retro.dto.CardDTO;
import com.blake.pmis.retro.dto.CreateCardRequest;
import com.blake.pmis.retro.dto.UpdateCardRequest;
import com.blake.pmis.retro.entity.BoardColumn;
import com.blake.pmis.retro.entity.Card;
import com.blake.pmis.retro.entity.CardVote;
import com.blake.pmis.retro.repository.BoardColumnRepository;
import com.blake.pmis.retro.repository.CardRepository;
import com.blake.pmis.retro.repository.CardVoteRepository;
import com.blake.pmis.retro.ws.WebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CardService {

    private final CardRepository cardRepository;
    private final CardVoteRepository cardVoteRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final RetroAuthService retroAuthService;
    private final WebSocketService webSocketService;

    public CardDTO createCard(CreateCardRequest req, User currentUser) {
        BoardColumn column = boardColumnRepository.findById(req.getColumnId())
                .orElseThrow(() -> new IllegalArgumentException("Column not found: " + req.getColumnId()));
        retroAuthService.assertParticipant(column.getBoardId(), currentUser.getId());
        retroAuthService.assertActive(column.getBoardId());

        Integer maxPos = cardRepository.findMaxPosition(req.getColumnId()).orElse(-1);
        Card card = Card.builder()
                .title(req.getTitle() != null ? req.getTitle() : "")
                .description(req.getDescription())
                .columnId(req.getColumnId())
                .creatorId(currentUser.getId())
                .position(maxPos + 1)
                .votes(0)
                .build();
        card = cardRepository.save(card);

        CardDTO dto = convertToDTO(card, currentUser.getId());
        webSocketService.broadcastBoardUpdate("card_created", column.getBoardId(), dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<CardDTO> getCardsByColumn(Long columnId, User currentUser) {
        BoardColumn column = boardColumnRepository.findById(columnId)
                .orElseThrow(() -> new IllegalArgumentException("Column not found: " + columnId));
        retroAuthService.assertParticipant(column.getBoardId(), currentUser.getId());
        return cardRepository.findByColumnIdOrderByPositionAsc(columnId).stream()
                .map(c -> convertToDTO(c, currentUser.getId()))
                .collect(Collectors.toList());
    }

    public CardDTO updateCard(Long id, UpdateCardRequest req, User currentUser) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Card not found: " + id));
        Long oldColumnId = card.getColumnId();
        BoardColumn column = boardColumnRepository.findById(oldColumnId)
                .orElseThrow(() -> new IllegalArgumentException("Column not found: " + oldColumnId));
        retroAuthService.assertParticipant(column.getBoardId(), currentUser.getId());
        retroAuthService.assertActive(column.getBoardId());
        // Only the card creator or the board owner can edit
        retroAuthService.assertCardEditor(column.getBoardId(), currentUser.getId(), card.getCreatorId());

        Long oldBoardId = column.getBoardId();
        if (req.getTitle() != null) {
            card.setTitle(req.getTitle());
        }
        if (req.getDescription() != null) {
            card.setDescription(req.getDescription());
        }

        Long destColumnId = oldColumnId;
        if (req.getColumnId() != null && !req.getColumnId().equals(oldColumnId)) {
            // Moving to a different column
            BoardColumn newColumn = boardColumnRepository.findById(req.getColumnId())
                    .orElseThrow(() -> new IllegalArgumentException("Column not found: " + req.getColumnId()));
            retroAuthService.assertParticipant(newColumn.getBoardId(), currentUser.getId());
            card.setColumnId(req.getColumnId());
            destColumnId = req.getColumnId();
        }

        int newPosition = req.getPosition() != null ? req.getPosition() : card.getPosition();
        card.setPosition(newPosition);
        card = cardRepository.save(card);

        // Re-index destination column to maintain sequential positions
        reindexColumn(destColumnId, id, newPosition);
        // If moved to a different column, re-index source column too
        if (!destColumnId.equals(oldColumnId)) {
            reindexColumn(oldColumnId, null, 0);
        }

        // Reload the card to get updated position after re-indexing
        card = cardRepository.findById(id).orElse(card);

        CardDTO dto = convertToDTO(card, currentUser.getId());
        webSocketService.broadcastBoardUpdate("card_updated", oldBoardId, dto);
        return dto;
    }

    private void reindexColumn(Long columnId, Long movedCardId, int movedCardPosition) {
        List<Card> cards = cardRepository.findByColumnIdOrderByPositionAsc(columnId);
        if (movedCardId != null) {
            // Remove the moved card from the list, then insert at the right position
            Card movedCard = cards.stream()
                    .filter(c -> c.getId().equals(movedCardId))
                    .findFirst()
                    .orElse(null);
            cards.removeIf(c -> c.getId().equals(movedCardId));
            if (movedCard != null) {
                int insertIndex = Math.min(movedCardPosition, cards.size());
                cards.add(insertIndex, movedCard);
            }
        }
        // Re-assign sequential positions
        for (int i = 0; i < cards.size(); i++) {
            cards.get(i).setPosition(i);
        }
        cardRepository.saveAll(cards);
    }

    public void deleteCard(Long id, User currentUser) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Card not found: " + id));
        Long colId = card.getColumnId();
        BoardColumn column = boardColumnRepository.findById(colId)
                .orElseThrow(() -> new IllegalArgumentException("Column not found: " + colId));
        retroAuthService.assertParticipant(column.getBoardId(), currentUser.getId());
        retroAuthService.assertActive(column.getBoardId());
        // Only the card creator or the board owner can delete
        retroAuthService.assertCardEditor(column.getBoardId(), currentUser.getId(), card.getCreatorId());

        Long boardId = column.getBoardId();
        cardRepository.delete(card);

        webSocketService.broadcastBoardUpdate("card_deleted", boardId, id);
    }

    public CardDTO voteCard(Long id, User currentUser) {
        Card card = cardRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Card not found: " + id));
        Long colId = card.getColumnId();
        BoardColumn column = boardColumnRepository.findById(colId)
                .orElseThrow(() -> new IllegalArgumentException("Column not found: " + colId));
        retroAuthService.assertParticipant(column.getBoardId(), currentUser.getId());
        retroAuthService.assertActive(column.getBoardId());

        boolean hasVoted = cardVoteRepository.existsByCardIdAndUserId(id, currentUser.getId());
        if (hasVoted) {
            // Unvote
            cardVoteRepository.deleteByCardIdAndUserId(id, currentUser.getId());
            card.setVotes(card.getVotes() - 1);
        } else {
            // Vote
            cardVoteRepository.save(CardVote.builder()
                    .cardId(id)
                    .userId(currentUser.getId())
                    .build());
            card.setVotes(card.getVotes() + 1);
        }
        card = cardRepository.save(card);

        CardDTO dto = convertToDTO(card, currentUser.getId());
        webSocketService.broadcastBoardUpdate("card_voted", column.getBoardId(), dto);
        return dto;
    }

    private CardDTO convertToDTO(Card card, Long currentUserId) {
        boolean votedByCurrentUser = cardVoteRepository.existsByCardIdAndUserId(card.getId(), currentUserId);
        return CardDTO.builder()
                .id(card.getId())
                .title(card.getTitle())
                .description(card.getDescription())
                .columnId(card.getColumnId())
                .creatorId(card.getCreatorId())
                .position(card.getPosition())
                .votes(card.getVotes())
                .votedByCurrentUser(votedByCurrentUser)
                .createdAt(card.getCreatedAt())
                .updatedAt(card.getUpdatedAt())
                .build();
    }
}
