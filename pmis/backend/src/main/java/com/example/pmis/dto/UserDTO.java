package com.example.pmis.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {

    private Long id;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 100, message = "Email must be less than 100 characters")
    private String email;

    @NotBlank(message = "Name is required")
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;

    @NotBlank(message = "Role is required")
    @Size(max = 50, message = "Role must be less than 50 characters")
    private String role;

    private Long teamId;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}