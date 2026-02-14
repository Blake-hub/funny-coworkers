package com.retroboard.service;

import com.retroboard.entity.BoardColumn;
import com.retroboard.entity.Board;
import com.retroboard.repository.BoardColumnRepository;
import com.retroboard.repository.BoardRepository;
import com.retroboard.dto.CreateColumnRequest;
import com.retroboard.dto.UpdateColumnRequest;
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
public class BoardColumnServiceTest {
    
    @Mock
    private BoardColumnRepository columnRepository;
    
    @Mock
    private BoardRepository boardRepository;
    
    @Mock
    private BoardService boardService;
    
    @InjectMocks
    private BoardColumnService boardColumnService;
    
    private Board board;
    private BoardColumn column;
    private CreateColumnRequest createColumnRequest;
    private UpdateColumnRequest updateColumnRequest;
    
    @BeforeEach
    void setUp() {
        board = new Board();
        board.setId(1L);
        board.setName("Test Board");
        
        column = new BoardColumn();
        column.setId(1L);
        column.setName("Test Column");
        column.setBoard(board);
        column.setPosition(0);
        
        createColumnRequest = new CreateColumnRequest();
        createColumnRequest.setName("Test Column");
        createColumnRequest.setBoardId(1L);
        createColumnRequest.setPosition(0);
        
        updateColumnRequest = new UpdateColumnRequest();
        updateColumnRequest.setName("Updated Column");
        updateColumnRequest.setPosition(1);
    }
    
    @Test
    void testCreateColumn() {
        when(boardRepository.findById(1L)).thenReturn(Optional.of(board));
        when(boardService.getBoardById(1L)).thenReturn(board);
        when(columnRepository.save(any(BoardColumn.class))).thenReturn(column);
        
        BoardColumn createdColumn = boardColumnService.createColumn(createColumnRequest);
        
        assertNotNull(createdColumn);
        assertEquals("Test Column", createdColumn.getName());
        verify(columnRepository, times(1)).save(any(BoardColumn.class));
    }
    
    @Test
    void testCreateColumn_BoardNotFound() {
        when(boardRepository.findById(1L)).thenReturn(Optional.empty());
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            boardColumnService.createColumn(createColumnRequest);
        });
        
        assertEquals("Board not found", exception.getMessage());
    }
    
    @Test
    void testDeleteColumn() {
        when(columnRepository.findById(1L)).thenReturn(Optional.of(column));
        when(boardService.getBoardById(1L)).thenReturn(board);
        doNothing().when(columnRepository).delete(column);
        
        boardColumnService.deleteColumn(1L);
        
        verify(columnRepository, times(1)).delete(column);
    }
    
    @Test
    void testDeleteColumn_ColumnNotFound() {
        when(columnRepository.findById(1L)).thenReturn(Optional.empty());
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            boardColumnService.deleteColumn(1L);
        });
        
        assertEquals("Column not found", exception.getMessage());
    }
    
    @Test
    void testGetAllColumns() {
        when(boardService.getBoardById(1L)).thenReturn(board);
        when(boardRepository.findById(1L)).thenReturn(Optional.of(board));
        when(columnRepository.findByBoardOrderByPositionAsc(board)).thenReturn(List.of(column));
        
        List<BoardColumn> columns = boardColumnService.getAllColumns(1L);
        
        assertNotNull(columns);
        assertEquals(1, columns.size());
        assertEquals(column, columns.get(0));
    }
    
    @Test
    void testUpdateColumn() {
        when(columnRepository.findById(1L)).thenReturn(Optional.of(column));
        when(boardService.getBoardById(1L)).thenReturn(board);
        when(columnRepository.save(any(BoardColumn.class))).thenReturn(column);
        
        BoardColumn updatedColumn = boardColumnService.updateColumn(1L, updateColumnRequest);
        
        assertNotNull(updatedColumn);
        assertEquals("Updated Column", updatedColumn.getName());
        verify(columnRepository, times(1)).save(any(BoardColumn.class));
    }
    
    @Test
    void testUpdateColumn_ColumnNotFound() {
        when(columnRepository.findById(1L)).thenReturn(Optional.empty());
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            boardColumnService.updateColumn(1L, updateColumnRequest);
        });
        
        assertEquals("Column not found", exception.getMessage());
    }
    
    @Test
    void testGetColumnById() {
        when(columnRepository.findById(1L)).thenReturn(Optional.of(column));
        when(boardService.getBoardById(1L)).thenReturn(board);
        
        BoardColumn foundColumn = boardColumnService.getColumnById(1L);
        
        assertNotNull(foundColumn);
        assertEquals(column, foundColumn);
    }
    
    @Test
    void testGetColumnById_ColumnNotFound() {
        when(columnRepository.findById(1L)).thenReturn(Optional.empty());
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            boardColumnService.getColumnById(1L);
        });
        
        assertEquals("Column not found", exception.getMessage());
    }
}
