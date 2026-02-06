package com.retroboard.dto;

import lombok.Data;

@Data
public class TokenResponse {
    private String token;
    private String username;
    private Long userId;
    
    public TokenResponse(String token) {
        this.token = token;
    }
    
    public TokenResponse(String token, String username, Long userId) {
        this.token = token;
        this.username = username;
        this.userId = userId;
    }
}
