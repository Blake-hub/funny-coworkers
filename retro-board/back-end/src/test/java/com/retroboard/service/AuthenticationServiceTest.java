package com.retroboard.service;

import com.retroboard.dto.LoginRequest;
import com.retroboard.dto.RegisterRequest;
import com.retroboard.dto.TokenResponse;
import com.retroboard.entity.User;
import com.retroboard.repository.UserRepository;
import com.retroboard.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthenticationServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @InjectMocks
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testRegister_Success() {
        // Arrange
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("test@example.com");

        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encodedPassword");
        when(jwtUtil.generateToken(registerRequest.getUsername())).thenReturn("testToken");

        // Act
        TokenResponse tokenResponse = authenticationService.register(registerRequest);

        // Assert
    assertNotNull(tokenResponse);
    assertEquals("testToken", tokenResponse.getToken());
    assertEquals("testuser", tokenResponse.getUsername());
    verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testRegister_UsernameAlreadyExists() {
        // Arrange
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("existinguser");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("test@example.com");

        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authenticationService.register(registerRequest);
        });
        assertEquals("Username already exists", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testRegister_EmailAlreadyExists() {
        // Arrange
        RegisterRequest registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setPassword("password123");
        registerRequest.setEmail("existing@example.com");

        when(userRepository.existsByUsername(registerRequest.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authenticationService.register(registerRequest);
        });
        assertEquals("Email already exists", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testLogin_Success() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        when(userRepository.findByUsername(loginRequest.getUsername())).thenReturn(Optional.of(user));
        
        when(jwtUtil.generateToken(loginRequest.getUsername())).thenReturn("testToken");

        // Act
        TokenResponse tokenResponse = authenticationService.login(loginRequest);

        // Assert
        assertNotNull(tokenResponse);
        assertEquals("testToken", tokenResponse.getToken());
        assertEquals("testuser", tokenResponse.getUsername());
        assertEquals(1L, tokenResponse.getUserId());
    }

    @Test
    void testLogin_AuthenticationFailure() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("wrongpassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new RuntimeException("Authentication failed"));

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            authenticationService.login(loginRequest);
        });
        assertEquals("Authentication failed", exception.getMessage());
    }

    @Test
    void testValidateTokenForUser_ValidToken() {
        // Arrange
        String username = "testuser";
        String token = "validToken";
        User user = new User();
        user.setUsername(username);
        // Simulate the hashing that would be done in the service
        user.setActiveTokenHash(authenticationService.hashToken(token));
        
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(jwtUtil.validateToken(token)).thenReturn(true);

        // Act
        boolean result = authenticationService.validateTokenForUser(token, username);

        // Assert
        assertTrue(result);
    }

    @Test
    void testValidateTokenForUser_InvalidToken() {
        // Arrange
        String username = "testuser";
        String token = "invalidToken";
        User user = new User();
        user.setUsername(username);
        user.setActiveTokenHash(authenticationService.hashToken("differentToken"));
        
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(jwtUtil.validateToken(token)).thenReturn(true);

        // Act
        boolean result = authenticationService.validateTokenForUser(token, username);

        // Assert
        assertFalse(result);
    }

    @Test
    void testValidateTokenForUser_ExpiredToken() {
        // Arrange
        String username = "testuser";
        String token = "expiredToken";
        User user = new User();
        user.setUsername(username);
        user.setActiveTokenHash(authenticationService.hashToken(token));
        
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(jwtUtil.validateToken(token)).thenReturn(false);

        // Act
        boolean result = authenticationService.validateTokenForUser(token, username);

        // Assert
        assertFalse(result);
    }

    @Test
    void testLogout() {
        // Arrange
        String username = "testuser";
        User user = new User();
        user.setUsername(username);
        user.setActiveTokenHash("someTokenHash");
        
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));

        // Act
        authenticationService.logout(username);

        // Assert
        assertNull(user.getActiveTokenHash());
        verify(userRepository, times(1)).save(user);
    }

    @Test
    void testSingleActiveSession() {
        // Arrange
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(authentication);
        
        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        
        // Mock userRepository to return the same user object and capture save operations
        when(userRepository.findByUsername(loginRequest.getUsername())).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            // Update our local user object with the values from the saved user
            user.setActiveTokenHash(savedUser.getActiveTokenHash());
            return savedUser;
        });
        
        // First login generates token1
        when(jwtUtil.generateToken(loginRequest.getUsername())).thenReturn("token1", "token2");
        when(jwtUtil.validateToken(anyString())).thenReturn(true);

        // Act
        TokenResponse firstLoginResponse = authenticationService.login(loginRequest);
        TokenResponse secondLoginResponse = authenticationService.login(loginRequest);

        // Assert
        assertNotNull(firstLoginResponse);
        assertNotNull(secondLoginResponse);
        assertEquals("token1", firstLoginResponse.getToken());
        assertEquals("token2", secondLoginResponse.getToken());
        
        // Verify that the second login invalidates the first token
        boolean firstTokenValid = authenticationService.validateTokenForUser("token1", "testuser");
        boolean secondTokenValid = authenticationService.validateTokenForUser("token2", "testuser");
        
        assertFalse(firstTokenValid);
        assertTrue(secondTokenValid);
    }
}
