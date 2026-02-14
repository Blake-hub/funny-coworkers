package com.retroboard.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.lang.reflect.Field;
import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() throws Exception {
        jwtUtil = new JwtUtil();

        // Use reflection to set private fields
        Field secretKeyField = JwtUtil.class.getDeclaredField("secretKey");
        secretKeyField.setAccessible(true);
        secretKeyField.set(jwtUtil, "thisisalongenoughtestsecretkeyfortestingjwtutil12345");

        Field expirationMsField = JwtUtil.class.getDeclaredField("expirationMs");
        expirationMsField.setAccessible(true);
        expirationMsField.set(jwtUtil, 3600000L);

        Field issuerField = JwtUtil.class.getDeclaredField("issuer");
        issuerField.setAccessible(true);
        issuerField.set(jwtUtil, "retro-board-test");
    }

    @Test
    void testGenerateToken() {
        String token = jwtUtil.generateToken("testuser");
        assertNotNull(token);
        assertTrue(token.length() > 0);
    }

    @Test
    void testGetUsernameFromToken() {
        String username = "testuser";
        String token = jwtUtil.generateToken(username);

        String extractedUsername = jwtUtil.getUsernameFromToken(token);
        assertEquals(username, extractedUsername);
    }

    @Test
    void testValidateToken_ValidToken() {
        String token = jwtUtil.generateToken("testuser");
        assertTrue(jwtUtil.validateToken(token));
    }

    @Test
    void testValidateToken_InvalidSignature() {
        // Create a token with a different secret
        JwtUtil otherJwtUtil = new JwtUtil();
        try {
            Field secretKeyField = JwtUtil.class.getDeclaredField("secretKey");
            secretKeyField.setAccessible(true);
            secretKeyField.set(otherJwtUtil, "adifferentlongenoughtestsecretkeyforjwtutil");

            Field expirationMsField = JwtUtil.class.getDeclaredField("expirationMs");
            expirationMsField.setAccessible(true);
            expirationMsField.set(otherJwtUtil, 3600000L);

            Field issuerField = JwtUtil.class.getDeclaredField("issuer");
            issuerField.setAccessible(true);
            issuerField.set(otherJwtUtil, "retro-board-test");

            String invalidToken = otherJwtUtil.generateToken("testuser");
            assertFalse(jwtUtil.validateToken(invalidToken));
        } catch (Exception e) {
            fail("Should not throw exception");
        }
    }

    @Test
    void testValidateToken_MalformedToken() {
        assertFalse(jwtUtil.validateToken("this-is-not-a-jwt-token"));
    }

    @Test
    void testValidateToken_EmptyToken() {
        assertFalse(jwtUtil.validateToken(""));
    }

    @Test
    void testValidateToken_NullToken() {
        assertFalse(jwtUtil.validateToken(null));
    }
}
