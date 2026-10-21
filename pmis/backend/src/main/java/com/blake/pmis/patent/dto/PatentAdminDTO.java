package com.blake.pmis.patent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** Patent admin grant entry (module-level authorization). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatentAdminDTO {

    private Long userId;
    private String userName;
    private String userEmail;
    private Long grantedBy;
    private String grantedByName;
    private LocalDateTime grantedAt;
}
