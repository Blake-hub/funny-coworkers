package com.blake.pmis.patent.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/** Create request (JSON part of the multipart create call; disclosure file is a separate part). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePatentRequest {

    @NotBlank
    private String title;

    @NotEmpty
    private List<String> inventors;
}
