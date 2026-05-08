package com.madraza.dto.request;

public record ContactoRequest(
    String nombre,
    String email,
    String asunto,
    String mensaje
) {}
