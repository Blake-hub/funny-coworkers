package com.blake.pmis.patent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * One legal target status for the current viewer, computed from the transition table.
 * Drives the admin transition dialog on the frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AllowedTransitionDTO {

    private String toStatus;
    private Boolean requiresAttachment;
    private Boolean requiresApplicationNumber;
    private Boolean requiresCertificateNumber;
    private Boolean requiresApplicationTypeConfirm;
}
