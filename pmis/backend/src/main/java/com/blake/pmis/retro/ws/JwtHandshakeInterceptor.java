package com.blake.pmis.retro.ws;

import com.blake.pmis.entity.User;
import com.blake.pmis.repository.UserRepository;
import com.blake.pmis.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        try {
            URI uri = request.getURI();
            String query = uri.getQuery();
            if (query == null) {
                log.warn("WebSocket handshake rejected: no query parameters");
                return false;
            }

            // Extract token from query param: ?token=xxx
            String token = null;
            for (String param : query.split("&")) {
                String[] kv = param.split("=", 2);
                if ("token".equals(kv[0]) && kv.length == 2) {
                    token = kv[1];
                    break;
                }
            }
            if (token == null || token.isEmpty()) {
                log.warn("WebSocket handshake rejected: no token in query");
                return false;
            }

            if (!jwtUtil.validateToken(token)) {
                log.warn("WebSocket handshake rejected: invalid token");
                return false;
            }

            String email = jwtUtil.getEmailFromToken(token);
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                log.warn("WebSocket handshake rejected: user not found for email {}", email);
                return false;
            }

            // Store user in session attributes for later use
            attributes.put("user", user);
            attributes.put("userId", user.getId());
            log.info("WebSocket handshake success for user: {}", email);
            return true;
        } catch (Exception e) {
            log.error("WebSocket handshake error", e);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // no-op
    }
}
