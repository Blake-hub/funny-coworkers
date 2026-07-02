package com.example.pmis.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateWikiFolderRequest {

    @Size(max = 200, message = "Name must be less than 200 characters")
    private String name;

    private Long parentFolderId;

    private String visibility;

    private Long teamId;
}
