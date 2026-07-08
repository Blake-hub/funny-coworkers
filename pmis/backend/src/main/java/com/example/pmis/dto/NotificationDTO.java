package com.example.pmis.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String type;
    private Boolean readStatus;
    private LocalDateTime createdAt;
    private String title;
    private String actionUrl;
}
