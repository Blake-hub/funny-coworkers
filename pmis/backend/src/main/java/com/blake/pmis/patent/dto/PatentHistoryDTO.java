package com.blake.pmis.patent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** One entry of the patent status history (undone rows keep visible with a flag). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentHistoryDTO {

    private Long id;
    private String fromStatus;
    private String toStatus;
    private LocalDate eventDate;
    private Long operatorId;
    private String operatorName;
    private String applicationNumber;
    private String certificateNumber;
    private String applicationType;
    private Boolean undone;
    private LocalDateTime undoneAt;
    private LocalDateTime createdAt;
}
