package com.blake.pmis.patent.dto;

import com.blake.pmis.entity.enumeration.PatentStatus;
import com.blake.pmis.entity.enumeration.PatentType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Status transition request (JSON part of the multipart transition call;
 * optional attachment file is a separate part).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransitionRequest {

    @NotNull
    private PatentStatus toStatus;

    /** Stage date; defaults to today when omitted. */
    private LocalDate eventDate;

    /** Required when toStatus == ACCEPTED. */
    private String applicationNumber;

    /** Required when toStatus == GRANTED. */
    private String certificateNumber;

    /** Required when toStatus == PAID (application type confirmation). */
    private PatentType applicationType;
}
