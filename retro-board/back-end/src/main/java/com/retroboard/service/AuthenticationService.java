package com.retroboard.service;

import com.retroboard.dto.LoginRequest;
import com.retroboard.dto.RegisterRequest;
import com.retroboard.dto.TokenResponse;
import com.retroboard.entity.User;
import com.retroboard.repository.UserRepository;
import com.retroboard.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestBody;

@Service
public class AuthenticationService {
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtil jwtUtil;
    
    public TokenResponse login(LoginRequest loginRequest) throws AuthenticationException {
        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                loginRequest.getUsername(),
                loginRequest.getPassword()
            )
        );
        
        // Get user from database to get ID
        User user = userRepository.findByUsername(loginRequest.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Generate JWT token
        String token = jwtUtil.generateToken(loginRequest.getUsername());
        
        return new TokenResponse(token, user.getUsername(), user.getId());
    }
    
    public TokenResponse register(RegisterRequest registerRequest) {
        // Check if username already exists
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        
        // Check if email already exists
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        
        // Create new user
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setEmail(registerRequest.getEmail());
        
        userRepository.save(user);
        
        // Generate JWT token
        String token = jwtUtil.generateToken(user.getUsername());
        
        return new TokenResponse(token, user.getUsername(), user.getId());
    }
}
