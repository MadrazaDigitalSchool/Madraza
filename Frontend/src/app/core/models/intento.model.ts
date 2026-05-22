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
    porcentaje: number;
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
    tiempoEmpleado: number;
    pendienteCorreccion: boolean;
}

export interface DetalleRespuesta {
    preguntaId: number;
    enunciado: string;
    tipo: 'OPCION_MULTIPLE' | 'VERDADERO_FALSO' | 'TEXTO_LIBRE';
    puntos: number;
    explicacion?: string;
    textoLibre?: string;
    esCorrecta: boolean;
    pendienteCorreccion: boolean;
    opcionSeleccionadaId?: number;
    opciones: { id: number; texto: string; esCorrecta: boolean | null; orden: number }[];
}

export interface PendienteCorreccion {
    testId: number;
    testTitulo: string;
    pendientes: number;
}

export interface IntentoParaCorregir {
    intentoId: number;
    inicio: string;
    respuestasPendientes: {
        respuestaId: number;
        enunciado: string;
        explicacion?: string;
        textoLibre?: string;
        puntos: number;
    }[];
}