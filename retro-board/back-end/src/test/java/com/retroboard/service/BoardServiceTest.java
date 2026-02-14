package com.retroboard.service;

import com.retroboard.entity.Board;
import com.retroboard.entity.BoardColumn;
import com.retroboard.entity.Team;
import com.retroboard.entity.User;
import com.retroboard.repository.BoardColumnRepository;
import com.retroboard.repository.BoardRepository;
import com.retroboard.repository.TeamRepository;
import com.retroboard.repository.UserRepository;
import com.retroboard.dto.CreateBoardRequest;
import com.retroboard.dto.UpdateBoardRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BoardServiceTest {
    
    @Mock
    private BoardRepository boardRepository;
    
    @Mock
    private BoardColumnRepository boardColumnRepository;
    
    @Mock
    private TeamRepository teamRepository;
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private Authentication authentication;
    
    @Mock
    private SecurityContext securityContext;
    
    @Mock
    private UserDetails userDetails;
    
    @InjectMocks
    private BoardService boardService;
    
    private User user;
    private Team team;
    private Board board;
    private CreateBoardRequest createBoardRequest;
    private UpdateBoardRequest updateBoardRequest;
    
    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setPassword("password");
        user.setEmail("test@example.com");
        user.setDisabled(false);
        user.setCreatedAt(LocalDateTime.now());
        
        team = new Team();
        team.setId(1L);
        team.setName("Test Team");
        team.setOwner(user);
        team.setCreatedAt(LocalDateTime.now());
        
        board = new Board();
        board.setId(1L);
        board.setName("Test Board");
        board.setDescription("Test Description");
        board.setTeam(team);
        
        createBoardRequest = new CreateBoardRequest();
        createBoardRequest.setName("Test Board");
        createBoardRequest.setDescription("Test Description");
        createBoardRequest.setTeamId(1L);
        
        updateBoardRequest = new UpdateBoardRequest();
        updateBoardRequest.setName("Updated Board");
        updateBoardRequest.setDescription("Updated Description");
    }
    
    private void setupSecurityContext() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userDetails.getUsername()).thenReturn("testuser");
    }
    
    @Test
    void testCreateBoard() {
        setupSecurityContext();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(teamRepository.existsByTeamIdAndOwnerOrMember(1L, user)).thenReturn(true);
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));
        when(boardRepository.save(any(Board.class))).thenReturn(board);
        when(boardColumnRepository.save(any(BoardColumn.class))).thenReturn(new BoardColumn());
        
        Board createdBoard = boardService.createBoard(createBoardRequest);
        
        assertNotNull(createdBoard);
        assertEquals("Test Board", createdBoard.getName());
        verify(boardRepository, times(1)).save(any(Board.class));
        verify(boardColumnRepository, times(3)).save(any(BoardColumn.class));
    }
    
    @Test
    void testCreateBoard_TeamNotFound() {
        setupSecurityContext();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(teamRepository.existsByTeamIdAndOwnerOrMember(1L, user)).thenReturn(true);
        when(teamRepository.findById(1L)).thenReturn(Optional.empty());
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            boardService.createBoard(createBoardRequest);
        });
        
        assertEquals("Team not found", exception.getMessage());
    }
    
    @Test
    void testDeleteBoard() {
        setupSecurityContext();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(teamRepository.existsByTeamIdAndOwnerOrMember(1L, user)).thenReturn(true);
        when(boardRepository.findById(1L)).thenReturn(Optional.of(board));
        doNothing().when(boardRepository).delete(board);
        
        boardService.deleteBoard(1L);
        
        verify(boardRepository, times(1)).delete(board);
    }
    
    @Test
    void testDeleteBoard_BoardNotFound() {
        when(boardRepository.findById(1L)).thenReturn(Optional.empty());
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            boardService.deleteBoard(1L);
        });
        
        assertEquals("Board not found", exception.getMessage());
    }
    
    @Test
    void testGetAllBoards() {
        setupSecurityContext();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(teamRepository.existsByTeamIdAndOwnerOrMember(1L, user)).thenReturn(true);
        when(teamRepository.findById(1L)).thenReturn(Optional.of(team));
        when(boardRepository.findByTeam(team)).thenReturn(List.of(board));
        
        List<Board> boards = boardService.getAllBoards(1L);
        
        assertNotNull(boards);
        assertEquals(1, boards.size());
        assertEquals(board, boards.get(0));
    }
    
    @Test
    void testUpdateBoard() {
        setupSecurityContext();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(teamRepository.existsByTeamIdAndOwnerOrMember(1L, user)).thenReturn(true);
        when(boardRepository.findById(1L)).thenReturn(Optional.of(board));
        when(boardRepository.save(any(Board.class))).thenReturn(board);
        
        Board updatedBoard = boardService.updateBoard(1L, updateBoardRequest);
        
        assertNotNull(updatedBoard);
        assertEquals("Updated Board", updatedBoard.getName());
        verify(boardRepository, times(1)).save(any(Board.class));
    }
    
    @Test
    void testUpdateBoard_BoardNotFound() {
        when(boardRepository.findById(1L)).thenReturn(Optional.empty());
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            boardService.updateBoard(1L, updateBoardRequest);
        });
        
        assertEquals("Board not found", exception.getMessage());
    }
    
    @Test
    void testGetBoardById() {
        setupSecurityContext();
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(user));
        when(teamRepository.existsByTeamIdAndOwnerOrMember(1L, user)).thenReturn(true);
        when(boardRepository.findById(1L)).thenReturn(Optional.of(board));
        
        Board foundBoard = boardService.getBoardById(1L);
        
        assertNotNull(foundBoard);
        assertEquals(board, foundBoard);
    }
    
    @Test
    void testGetBoardById_BoardNotFound() {
        when(boardRepository.findById(1L)).thenReturn(Optional.empty());
        
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            boardService.getBoardById(1L);
        });
        
        assertEquals("Board not found", exception.getMessage());
    }
}
