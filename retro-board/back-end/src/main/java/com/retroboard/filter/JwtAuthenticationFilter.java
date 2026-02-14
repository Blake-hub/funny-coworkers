package com.retroboard.filter;

import com.retroboard.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    @Autowired
    private JwtUtil jwtUtil;
    
    @Autowired
    private UserDetailsService userDetailsService;
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) 
            throws ServletException, IOException {
        
        String authorizationHeader = request.getHeader("Authorization");
        String username = null;
        String jwtToken = null;
        
        // Extract token from Authorization header
        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwtToken = authorizationHeader.substring(7);
            try {
                // First validate the token
                if (jwtUtil.validateToken(jwtToken)) {
                    username = jwtUtil.getUsernameFromToken(jwtToken);
                    logger.debug("Extracted username from token: {}", username);
                } else {
                    // Invalid token, clear authentication
                    logger.debug("Token validation failed");
                    SecurityContextHolder.clearContext();
                }
            } catch (Exception e) {
                // Invalid token
                logger.debug("Invalid token: {}", e.getMessage());
                // Clear any existing authentication
                SecurityContextHolder.clearContext();
            }
        } else {
            // No token provided, clear any existing authentication
            logger.debug("No Authorization header provided");
            SecurityContextHolder.clearContext();
        }
        
        // Set authentication if we have a valid username
        if (username != null) {
            try {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                logger.debug("Loaded user details for: {}", username);
                
                UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities());
                authenticationToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authenticationToken);
                logger.debug("Set authentication for: {}", username);
            } catch (UsernameNotFoundException e) {
                // User not found, clear authentication
                logger.debug("User not found: {}", username);
                SecurityContextHolder.clearContext();
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
