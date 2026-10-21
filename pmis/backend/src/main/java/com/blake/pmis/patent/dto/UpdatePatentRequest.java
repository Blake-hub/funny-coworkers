package com.blake.pmis.patent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Creator edit request (allowed only while status is SUBMITTED). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePatentRequest {

    @NotBlank
    private String title;

    @NotEmpty
    private List<String> inventors;
}
