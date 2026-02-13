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
public class BoardService {
    
    private static final Logger logger = LoggerFactory.getLogger(BoardService.class);
    
    @Autowired
    private BoardRepository boardRepository;
    
    @Autowired
    private BoardColumnRepository boardColumnRepository;
    
    @Autowired
    private TeamRepository teamRepository;
    
    @Autowired
    private UserRepository userRepository;
    
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
    
    // Check if user has access to the team (owner or member)
    private void checkTeamAccess(Long teamId) {
        User currentUser = getCurrentUser();
        if (!teamRepository.existsByTeamIdAndOwnerOrMember(teamId, currentUser)) {
            throw new RuntimeException("Access denied: You don't have permission to access this team");
        }
    }
    
    @Transactional
    public Board createBoard(CreateBoardRequest request) {
        // Check team access
        checkTeamAccess(request.getTeamId());
        
        // Get the team
        Team team = teamRepository.findById(request.getTeamId())
            .orElseThrow(() -> new RuntimeException("Team not found"));
        
        // Create the board
        Board board = new Board();
        board.setName(request.getName());
        board.setDescription(request.getDescription());
        board.setTeam(team);
        
        // Save the board to get its ID
        board = boardRepository.save(board);
        
        // Create default columns
        createDefaultColumns(board);
        
        return board;
    }
    
    @Transactional
    public void deleteBoard(Long boardId) {
        // Get the board
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new RuntimeException("Board not found"));
        
        // Check team access
        checkTeamAccess(board.getTeam().getId());
        
        // Delete the board
        boardRepository.delete(board);
    }
    
    public List<Board> getAllBoards(Long teamId) {
        // Check team access
        checkTeamAccess(teamId);
        
        // Get the team
        Team team = teamRepository.findById(teamId)
            .orElseThrow(() -> new RuntimeException("Team not found"));
        
        return boardRepository.findByTeam(team);
    }
    
    @Transactional
    public Board updateBoard(Long boardId, UpdateBoardRequest request) {
        // Get the board
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new RuntimeException("Board not found"));
        
        // Check team access
        checkTeamAccess(board.getTeam().getId());
        
        // Update board fields if provided
        if (request.getName() != null) {
            board.setName(request.getName());
        }
        if (request.getDescription() != null) {
            board.setDescription(request.getDescription());
        }
        
        return boardRepository.save(board);
    }
    
    public Board getBoardById(Long boardId) {
        // Get the board
        Board board = boardRepository.findById(boardId)
            .orElseThrow(() -> new RuntimeException("Board not found"));
        
        // Check team access
        checkTeamAccess(board.getTeam().getId());
        
        return board;
    }
    
    // Create default columns for a new board
    private void createDefaultColumns(Board board) {
        logger.debug("Creating default columns for board: {}", board.getName());
        
        // Default column titles
        String[] defaultColumnTitles = {
            "What Went Well",
            "What Didn't Go Well",
            "Action Items"
        };
        
        // Create columns with positions 0, 1, 2
        for (int i = 0; i < defaultColumnTitles.length; i++) {
            BoardColumn column = new BoardColumn();
            column.setName(defaultColumnTitles[i]);
            column.setBoard(board);
            column.setPosition(i);
            boardColumnRepository.save(column);
            logger.debug("Created column: {} for board: {}", defaultColumnTitles[i], board.getName());
        }
        
        logger.debug("Default columns created successfully for board: {}", board.getName());
    }
}
