package com.madraza.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * @author Hafdala Mehdi Sidi
 */
public record RegistroRequest(
        @NotBlank @Size(max = 60) String nombre,
        @NotBlank @Size(max = 100) String apellidos,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 40) String password
) {}