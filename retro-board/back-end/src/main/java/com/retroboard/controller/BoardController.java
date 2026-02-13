package com.retroboard.controller;

import com.retroboard.entity.Board;
import com.retroboard.service.BoardService;
import com.retroboard.dto.CreateBoardRequest;
import com.retroboard.dto.UpdateBoardRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/boards")
public class BoardController {
    
    @Autowired
    private BoardService boardService;
    
    // Create a new board
    @PostMapping
    public ResponseEntity<Board> createBoard(@RequestBody CreateBoardRequest request) {
        Board board = boardService.createBoard(request);
        return new ResponseEntity<>(board, HttpStatus.CREATED);
    }
    
    // Delete a board
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(@PathVariable Long id) {
        boardService.deleteBoard(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    // Query all boards for a team
    @GetMapping("/team/{teamId}")
    public ResponseEntity<List<Board>> getAllBoards(@PathVariable Long teamId) {
        List<Board> boards = boardService.getAllBoards(teamId);
        return new ResponseEntity<>(boards, HttpStatus.OK);
    }
    
    // Update a board
    @PutMapping("/{id}")
    public ResponseEntity<Board> updateBoard(@PathVariable Long id, @RequestBody UpdateBoardRequest request) {
        Board updatedBoard = boardService.updateBoard(id, request);
        return new ResponseEntity<>(updatedBoard, HttpStatus.OK);
    }
    
    // Get a board by id
    @GetMapping("/{id}")
    public ResponseEntity<Board> getBoardById(@PathVariable Long id) {
        Board board = boardService.getBoardById(id);
        return new ResponseEntity<>(board, HttpStatus.OK);
    }
}
