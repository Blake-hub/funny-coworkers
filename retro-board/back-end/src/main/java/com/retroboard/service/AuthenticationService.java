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
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

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
    
    public String hashToken(String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(token.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing token", e);
        }
    }
    
    public TokenResponse login(LoginRequest loginRequest) throws AuthenticationException {
        // Authenticate user
        authenticationManager.authenticate(
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
        
        // Hash the token and store it in the user record
        String tokenHash = hashToken(token);
        user.setActiveTokenHash(tokenHash);
        userRepository.save(user);
        
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
        
        // Generate JWT token
        String token = jwtUtil.generateToken(user.getUsername());
        
        // Hash the token and store it in the user record
        String tokenHash = hashToken(token);
        user.setActiveTokenHash(tokenHash);
        
        // Save user once with all data
        userRepository.save(user);
        
        return new TokenResponse(token, user.getUsername(), user.getId());
    }
    
    public boolean validateTokenForUser(String token, String username) {
        // Validate token format
        if (!jwtUtil.validateToken(token)) {
            return false;
        }
        
        // Get user from database
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if token matches the active token hash
        String tokenHash = hashToken(token);
        return tokenHash.equals(user.getActiveTokenHash());
    }
    
    public void logout(String username) {
        // Get user from database
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Clear active token hash
        user.setActiveTokenHash(null);
        userRepository.save(user);
    }
}
