/**
 * Modelos de datos del usuario
 * @author Hafdala Mehdi Sidi
 */

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegistroRequest {
    nombre: string;
    apellidos: string;
    email: string;
    password: string;
}

export interface JwtResponse {
    token: string;
    id: number;
    nombre: string;
    email: string;
    roles: string[];
    suscripcionActiva: boolean;
    suscripcionExpiry?: string;
    planTipo?: string;
    metodoPago?: string;
}

export interface Usuario {
    id: number;
    nombre: string;
    apellidos: string;
    email: string;
    avatarUrl?: string;
    emailVerificado: boolean;
    suscripcionActiva: boolean;
    suscripcionExpiry?: string;
    planTipo?: string;
    metodoPago?: string;
    proveedorOauth?: string;
    roles: string[];
}
