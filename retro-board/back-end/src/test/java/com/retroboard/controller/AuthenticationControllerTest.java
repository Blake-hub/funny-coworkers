package com.retroboard.controller;

import com.retroboard.dto.LoginRequest;
import com.retroboard.dto.RegisterRequest;
import com.retroboard.dto.TokenResponse;
import com.retroboard.service.AuthenticationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthenticationControllerTest {

    @Mock
    private AuthenticationService authenticationService;

    @InjectMocks
    private AuthenticationController authenticationController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testLogin_Success() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        TokenResponse tokenResponse = new TokenResponse("testToken");
        when(authenticationService.login(loginRequest)).thenReturn(tokenResponse);

        // Act
        ResponseEntity<?> response = authenticationController.login(loginRequest);

        // Assert
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof TokenResponse);
        assertEquals("testToken", ((TokenResponse) response.getBody()).getToken());
    }

    @Test
    void testLogin_Failure() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("wrongpassword");

        when(authenticationService.login(loginRequest)).thenThrow(new RuntimeException("Authentication failed"));

        // Act
        ResponseEntity<?> response = authenticationController.login(loginRequest);

        // Assert
        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
    }

    @Test
    void testRegister_Success() {
        // Arrange
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("test@example.com");

        TokenResponse tokenResponse = new TokenResponse("testToken");
        when(authenticationService.register(registerRequest)).thenReturn(tokenResponse);

        // Act
        ResponseEntity<?> response = authenticationController.register(registerRequest);

        // Assert
        assertEquals(HttpStatus.CREATED, response.getStatusCode());
        assertNotNull(response.getBody());
        assertTrue(response.getBody() instanceof TokenResponse);
        assertEquals("testToken", ((TokenResponse) response.getBody()).getToken());
    }

    @Test
    void testRegister_UsernameAlreadyExists() {
        // Arrange
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("existinguser");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("test@example.com");

        when(authenticationService.register(registerRequest)).thenThrow(new RuntimeException("Username already exists"));

        // Act
        ResponseEntity<?> response = authenticationController.register(registerRequest);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
    }

    @Test
    void testRegister_EmailAlreadyExists() {
        // Arrange
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("existing@example.com");

        when(authenticationService.register(registerRequest)).thenThrow(new RuntimeException("Email already exists"));

        // Act
        ResponseEntity<?> response = authenticationController.register(registerRequest);

        // Assert
        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
    }

    // @Test
    // void testRegister_InternalServerError() {
    //     // Arrange
    //     RegisterRequest registerRequest = new RegisterRequest();
    //     registerRequest.setUsername("testuser");
    //     registerRequest.setPassword("password123");
    //     registerRequest.setEmail("test@example.com");

    //     when(authenticationService.register(registerRequest)).thenThrow(new Exception("Internal error"));

    //     // Act
    //     ResponseEntity<?> response = authenticationController.register(registerRequest);

    //     // Assert
    //     assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    // }
}
