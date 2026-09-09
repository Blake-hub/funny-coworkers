package com.blake.pmis.retro.dto;

import com.blake.pmis.retro.entity.BoardStatus;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardDTO {
    private Long id;
    private String title;
    private String description;
    private Long ownerId;
    private String ownerName;
    private Long teamId;
    private String teamName;
    private BoardStatus status;
    private Integer participantCount;
    private Long cardCount;
    private String currentUserRole;
    private List<ParticipantDTO> participants;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
