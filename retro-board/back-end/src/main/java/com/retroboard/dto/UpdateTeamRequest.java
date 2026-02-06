package com.retroboard.dto;

import lombok.Data;
import java.util.List;

@Data
public class UpdateTeamRequest {
    private String name;
    private Long ownerId;
    private List<TeamMemberRequest> members;
    
    @Data
    public static class TeamMemberRequest {
        private Long userId;
        private String role;
    }
}
