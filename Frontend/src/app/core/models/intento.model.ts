/**
 * Modelos de intentos y resultados de examen
 * Corresponden con Intento.java y RespuestaIntento.java
 * @author Hafdala Mehdi Sidi
 */

export interface Intento {
    id: number;
    puntuacion: number;
    totalPreguntas: number;
    correctas: number;
    incorrectas: number;
    tiempoEmpleado: number;
    estado: 'EN_CURSO' | 'COMPLETADO' | 'ABANDONADO';
    inicio: string;
    fin?: string;
    test: {
        id: number;
        titulo: string;
        categoria: string;
    };
}

export interface RespuestaRequest {
    preguntaId: number;
    opcionId?: number;
    textoLibre?: string;
}

export interface ResultadoResponse {
    intentoId: number;
    puntuacion: number;
    totalPreguntas: number;
    correctas: number;
    incorrectas: number;
    porcentaje: number;
    estado: string;
}