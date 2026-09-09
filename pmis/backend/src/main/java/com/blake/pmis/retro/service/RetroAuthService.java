package com.blake.pmis.retro.service;

import com.blake.pmis.retro.entity.Board;
import com.blake.pmis.retro.entity.BoardStatus;
import com.blake.pmis.retro.entity.ParticipantRole;
import com.blake.pmis.retro.repository.BoardParticipantRepository;
import com.blake.pmis.retro.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class RetroAuthService {

    private final BoardParticipantRepository boardParticipantRepository;
    private final BoardRepository boardRepository;

    /**
     * Assert user is a participant (owner or participant) of the board.
     * Throws AccessDeniedException (403) if not.
     */
    public void assertParticipant(Long boardId, Long userId) {
        if (!boardParticipantRepository.existsByBoardIdAndUserId(boardId, userId)) {
            throw new AccessDeniedException("Not a participant of this retro board");
        }
    }

    /**
     * Assert user is the owner of the board.
     * Throws AccessDeniedException (403) if not.
     */
    public void assertOwner(Long boardId, Long userId) {
        if (!boardParticipantRepository.existsByBoardIdAndUserIdAndRole(boardId, userId, ParticipantRole.OWNER)) {
            throw new AccessDeniedException("Only the board owner can perform this action");
        }
    }

    /**
     * Assert user is the board owner OR the card creator.
     * Only the creator and the host can edit/delete a card.
     * Throws AccessDeniedException (403) if neither.
     */
    public void assertCardEditor(Long boardId, Long userId, Long cardCreatorId) {
        // Owner can edit any card
        if (boardParticipantRepository.existsByBoardIdAndUserIdAndRole(boardId, userId, ParticipantRole.OWNER)) {
            return;
        }
        // Creator can edit their own card
        if (cardCreatorId != null && cardCreatorId.equals(userId)) {
            return;
        }
        throw new AccessDeniedException("Only the card creator or board owner can edit this card");
    }

    /**
     * Assert the board is in ACTIVE status.
     * Throws IllegalStateException (409) if ENDED.
     */
    public void assertActive(Board board) {
        if (board.getStatus() == BoardStatus.ENDED) {
            throw new IllegalStateException("This retrospective has ended and is read-only");
        }
    }

    /**
     * Convenience: load board by id and assert active.
     */
    public Board assertActive(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new IllegalArgumentException("Board not found: " + boardId));
        assertActive(board);
        return board;
    }
}
