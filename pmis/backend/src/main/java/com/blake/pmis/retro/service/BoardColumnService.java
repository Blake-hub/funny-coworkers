package com.blake.pmis.retro.service;

import com.blake.pmis.entity.User;
import com.blake.pmis.retro.dto.ColumnDTO;
import com.blake.pmis.retro.dto.CreateColumnRequest;
import com.blake.pmis.retro.dto.UpdateColumnRequest;
import com.blake.pmis.retro.entity.BoardColumn;
import com.blake.pmis.retro.repository.BoardColumnRepository;
import com.blake.pmis.retro.repository.CardRepository;
import com.blake.pmis.retro.ws.WebSocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardColumnService {

    private final BoardColumnRepository boardColumnRepository;
    private final CardRepository cardRepository;
    private final RetroAuthService retroAuthService;
    private final WebSocketService webSocketService;

    public ColumnDTO createColumn(CreateColumnRequest req, User currentUser) {
        retroAuthService.assertOwner(req.getBoardId(), currentUser.getId());
        retroAuthService.assertActive(req.getBoardId());

        Integer maxPos = boardColumnRepository.findMaxPosition(req.getBoardId()).orElse(-1);
        BoardColumn column = BoardColumn.builder()
                .name(req.getName())
                .boardId(req.getBoardId())
                .position(maxPos + 1)
                .build();
        column = boardColumnRepository.save(column);

        ColumnDTO dto = convertToDTO(column);
        webSocketService.broadcastBoardUpdate("column_created", req.getBoardId(), dto);
        return dto;
    }

    @Transactional(readOnly = true)
    public List<ColumnDTO> getColumnsByBoard(Long boardId, User currentUser) {
        retroAuthService.assertParticipant(boardId, currentUser.getId());
        return boardColumnRepository.findByBoardIdOrderByPositionAsc(boardId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public ColumnDTO updateColumn(Long id, UpdateColumnRequest req, User currentUser) {
        BoardColumn column = boardColumnRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Column not found: " + id));
        retroAuthService.assertOwner(column.getBoardId(), currentUser.getId());
        retroAuthService.assertActive(column.getBoardId());
        if (req.getName() != null) {
            column.setName(req.getName());
        }
        column = boardColumnRepository.save(column);

        ColumnDTO dto = convertToDTO(column);
        webSocketService.broadcastBoardUpdate("column_updated", column.getBoardId(), dto);
        return dto;
    }

    public void deleteColumn(Long id, User currentUser) {
        BoardColumn column = boardColumnRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Column not found: " + id));
        retroAuthService.assertOwner(column.getBoardId(), currentUser.getId());
        retroAuthService.assertActive(column.getBoardId());
        Long boardId = column.getBoardId();
        boardColumnRepository.delete(column);

        webSocketService.broadcastBoardUpdate("column_deleted", boardId, id);
    }

    private ColumnDTO convertToDTO(BoardColumn column) {
        long cardCount = cardRepository.countByBoardId(column.getBoardId());
        // For per-column count, we need findByColumnId count
        // Use a simpler approach: count cards in this column
        int count = cardRepository.findByColumnIdOrderByPositionAsc(column.getId()).size();
        return ColumnDTO.builder()
                .id(column.getId())
                .name(column.getName())
                .boardId(column.getBoardId())
                .position(column.getPosition())
                .cardCount(count)
                .build();
    }
}
