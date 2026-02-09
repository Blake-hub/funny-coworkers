package com.retroboard.controller;

import com.retroboard.entity.User;
import com.retroboard.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @Autowired
    private UserRepository userRepository;
    
    // Search users by username or email
    @GetMapping("/search")
    public ResponseEntity<List<User>> searchUsers(
            @RequestParam(value = "query", required = true) String query) {
        // Search by username containing the query or email containing the query
        List<User> users = userRepository.findByUsernameContainingOrEmailContaining(query, query);
        return ResponseEntity.ok(users);
    }
}
