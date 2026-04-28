package com.example.pmis.filter;

import com.example.pmis.entity.User;
import com.example.pmis.repository.UserRepository;
import com.example.pmis.util.JwtUtil;
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

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwtToken = authorizationHeader.substring(7);
            try {
                extractedEmail = jwtUtil.getEmailFromToken(jwtToken);
                logger.debug("Extracted email from token: {}", extractedEmail);

                if (!jwtUtil.validateToken(jwtToken)) {
                    logger.debug("Token validation failed");
                    SecurityContextHolder.clearContext();
                    extractedEmail = null;
                }
            } catch (Exception e) {
                logger.debug("Invalid token: {}", e.getMessage());
                SecurityContextHolder.clearContext();
                extractedEmail = null;
            }
        } else {
            logger.debug("No Authorization header provided");
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
                logger.debug("Set authentication for: {}", finalEmail);
            });
        }

        filterChain.doFilter(request, response);
    }
}