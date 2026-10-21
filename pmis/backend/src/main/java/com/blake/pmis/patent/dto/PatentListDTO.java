package com.blake.pmis.patent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

/** Row of the patent list page (no pagination). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentListDTO {

    private Long id;
    private String title;
    /** Applicant's original draft title. */
    private String originalTitle;
    private List<String> inventors;
    private String applicationType;
    /** Statutory patent category name (INVENTION / UTILITY_MODEL / DESIGN). */
    private String patentCategory;
    private String status;
    private String applicationNumber;
    private String certificateNumber;
    private Long creatorId;
    private String creatorName;

    // Stage dates (custom columns on the list page)
    private LocalDate submitDate;
    private LocalDate receivedDate;
    private LocalDate paidDate;
    private LocalDate acceptedDate;
    private LocalDate preliminaryPassedDate;
    private LocalDate publishedDate;
    private LocalDate priorityGrantedDate;
    private LocalDate substantiveExamDate;
    private LocalDate oaNotificationDate;
    private LocalDate grantFeePaidDate;
    private LocalDate grantedDate;
}
