package com.retroboard.controller;

import com.retroboard.entity.BoardColumn;
import com.retroboard.service.BoardColumnService;
import com.retroboard.dto.CreateColumnRequest;
import com.retroboard.dto.UpdateColumnRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/columns")
public class BoardColumnController {
    
    @Autowired
    private BoardColumnService columnService;
    
    // Create a new column
    @PostMapping
    public ResponseEntity<BoardColumn> createColumn(@RequestBody CreateColumnRequest request) {
        BoardColumn column = columnService.createColumn(request);
        return new ResponseEntity<>(column, HttpStatus.CREATED);
    }
    
    // Delete a column
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteColumn(@PathVariable Long id) {
        columnService.deleteColumn(id);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
    
    // Query all columns for a board
    @GetMapping("/board/{boardId}")
    public ResponseEntity<List<BoardColumn>> getAllColumns(@PathVariable Long boardId) {
        List<BoardColumn> columns = columnService.getAllColumns(boardId);
        return new ResponseEntity<>(columns, HttpStatus.OK);
    }
    
    // Update a column
    @PutMapping("/{id}")
    public ResponseEntity<BoardColumn> updateColumn(@PathVariable Long id, @RequestBody UpdateColumnRequest request) {
        BoardColumn updatedColumn = columnService.updateColumn(id, request);
        return new ResponseEntity<>(updatedColumn, HttpStatus.OK);
    }
    
    // Get a column by id
    @GetMapping("/{id}")
    public ResponseEntity<BoardColumn> getColumnById(@PathVariable Long id) {
        BoardColumn column = columnService.getColumnById(id);
        return new ResponseEntity<>(column, HttpStatus.OK);
    }
}
