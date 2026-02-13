package com.retroboard.service;

import com.retroboard.entity.BoardColumn;
import com.retroboard.entity.Board;
import com.retroboard.repository.BoardColumnRepository;
import com.retroboard.repository.BoardRepository;
import com.retroboard.dto.CreateColumnRequest;
import com.retroboard.dto.UpdateColumnRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class BoardColumnService {
    
    @Autowired
    private BoardColumnRepository columnRepository;
    
    @Autowired
    private BoardRepository boardRepository;
    
    @Autowired
    private BoardService boardService;
    
    @Transactional
    public BoardColumn createColumn(CreateColumnRequest request) {
        // Get the board
        Board board = boardRepository.findById(request.getBoardId())
            .orElseThrow(() -> new RuntimeException("Board not found"));
        
        // Check board access (via BoardService)
        boardService.getBoardById(board.getId());
        
        // Create the column
        BoardColumn column = new BoardColumn();
        column.setName(request.getName());
        column.setBoard(board);
        column.setPosition(request.getPosition());
        
        return columnRepository.save(column);
    }
    
    @Transactional
    public void deleteColumn(Long columnId) {
        // Get the column
        BoardColumn column = columnRepository.findById(columnId)
            .orElseThrow(() -> new RuntimeException("Column not found"));
        
        // Check board access (via BoardService)
        boardService.getBoardById(column.getBoard().getId());
        
        // Delete the column
        columnRepository.delete(column);
    }
    
    public List<BoardColumn> getAllColumns(Long boardId) {
        // Check board access (via BoardService)
        boardService.getBoardById(boardId);
        
        // Get the board
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new RuntimeException("Board not found"));
        
        return columnRepository.findByBoardOrderByPositionAsc(board);
    }
    
    @Transactional
    public BoardColumn updateColumn(Long columnId, UpdateColumnRequest request) {
        // Get the column
        BoardColumn column = columnRepository.findById(columnId)
            .orElseThrow(() -> new RuntimeException("Column not found"));
        
        // Check board access (via BoardService)
        boardService.getBoardById(column.getBoard().getId());
        
        // Update column fields if provided
        if (request.getName() != null) {
            column.setName(request.getName());
        }
        if (request.getPosition() != null) {
            column.setPosition(request.getPosition());
        }
        
        return columnRepository.save(column);
    }
    
    public BoardColumn getColumnById(Long columnId) {
        // Get the column
        BoardColumn column = columnRepository.findById(columnId)
            .orElseThrow(() -> new RuntimeException("Column not found"));
        
        // Check board access (via BoardService)
        boardService.getBoardById(column.getBoard().getId());
        
        return column;
    }
}
