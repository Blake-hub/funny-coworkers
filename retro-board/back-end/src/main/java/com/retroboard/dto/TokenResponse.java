package com.retroboard.dto;

import lombok.Data;

@Data
public class TokenResponse {
    private String token;
    private String username;
    
    public TokenResponse(String token) {
        this.token = token;
    }
    
    public TokenResponse(String token, String username) {
        this.token = token;
        this.username = username;
    }
}
