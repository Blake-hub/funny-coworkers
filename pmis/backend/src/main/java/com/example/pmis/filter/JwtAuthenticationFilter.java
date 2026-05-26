package com.example.pmis.filter;

import com.example.pmis.entity.User;
import com.example.pmis.repository.UserRepository;
import com.example.pmis.util.JwtUtil;
import io.jsonwebtoken.ExpiredJwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authorizationHeader = request.getHeader("Authorization");
        String extractedEmail = null;
        String jwtToken = null;

        logger.info("Processing request: {} {}", request.getMethod(), request.getRequestURI());
        logger.info("Authorization header present: {}", authorizationHeader != null);
        
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwtToken = authorizationHeader.substring(7);
            logger.info("Token extracted: {} characters", jwtToken != null ? jwtToken.length() : 0);
            try {
                extractedEmail = jwtUtil.getEmailFromToken(jwtToken);
                logger.info("Extracted email from token: {}", extractedEmail);

                if (!jwtUtil.validateToken(jwtToken)) {
                    logger.warn("Token validation failed for request: {} {}", request.getMethod(), request.getRequestURI());
                    SecurityContextHolder.clearContext();
                    extractedEmail = null;
                }
            } catch (ExpiredJwtException e) {
                logger.warn("Token expired: {}", e.getMessage());
                SecurityContextHolder.clearContext();
                extractedEmail = null;
            } catch (Exception e) {
                logger.warn("Token processing error: {}", e.getMessage());
                SecurityContextHolder.clearContext();
                extractedEmail = null;
            }
        } else {
            logger.warn("No Authorization header provided for: {} {}", request.getMethod(), request.getRequestURI());
            SecurityContextHolder.clearContext();
        }

        final String finalEmail = extractedEmail;
        if (finalEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            userRepository.findByEmail(finalEmail).ifPresent(user -> {
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole());
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                        user, null, Collections.singletonList(authority));
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                logger.info("Successfully authenticated user: {} with role: {}", finalEmail, user.getRole());
            });
        } else if (finalEmail == null) {
            logger.warn("Email extraction failed for request: {} {}", request.getMethod(), request.getRequestURI());
        } else if (SecurityContextHolder.getContext().getAuthentication() != null) {
            logger.info("Security context already has authentication for: {}", request.getRequestURI());
        }

        filterChain.doFilter(request, response);
    }
}