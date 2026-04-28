/**
 * Modelos de datos del usuario
 * Corresponden con las entidades del backend de Madraza
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
}

export interface Usuario {
    id: number;
    nombre: string;
    apellidos: string;
    email: string;
    avatarUrl?: string;
    emailVerificado: boolean;
    roles: string[];
}