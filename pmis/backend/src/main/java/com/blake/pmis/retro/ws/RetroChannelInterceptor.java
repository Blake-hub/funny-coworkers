package com.blake.pmis.retro.ws;

import com.blake.pmis.retro.repository.BoardParticipantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Objects;

@Slf4j
@Component
@RequiredArgsConstructor
public class RetroChannelInterceptor implements ChannelInterceptor {

    private final BoardParticipantRepository boardParticipantRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination != null && destination.startsWith("/topic/retro/")) {
                // Extract boardId from destination: /topic/retro/{boardId}
                String[] parts = destination.split("/");
                if (parts.length >= 4) {
                    try {
                        Long boardId = Long.parseLong(parts[3]);
                        Map<String, Object> sessionAttrs = accessor.getSessionAttributes();
                        if (sessionAttrs == null) {
                            log.warn("WebSocket SUBSCRIBE rejected: no session attributes");
                            return null;
                        }
                        Long userId = (Long) sessionAttrs.get("userId");
                        if (userId == null) {
                            log.warn("WebSocket SUBSCRIBE rejected: no userId in session");
                            return null;
                        }
                        if (!boardParticipantRepository.existsByBoardIdAndUserId(boardId, userId)) {
                            log.warn("WebSocket SUBSCRIBE rejected: user {} is not a participant of board {}",
                                    userId, boardId);
                            return null;
                        }
                        log.debug("WebSocket SUBSCRIBE allowed: user {} -> board {}", userId, boardId);
                    } catch (NumberFormatException e) {
                        log.warn("WebSocket SUBSCRIBE rejected: invalid boardId in destination {}", destination);
                        return null;
                    }
                }
            }
        }

        return message;
    }
}
