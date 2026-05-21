/**
 * Modelos de tests, preguntas y opciones
 * Corresponden con Test.java, Pregunta.java y Opcion.java
 * @author Hafdala Mehdi Sidi
 */

export interface Opcion {
    id: number;
    texto: string;
    esCorrecta: boolean;
    orden: number;
}

export interface Pregunta {
    id: number;
    enunciado: string;
    tipo: 'OPCION_MULTIPLE' | 'VERDADERO_FALSO' | 'TEXTO_LIBRE';
    orden: number;
    puntos: number;
    explicacion?: string;
    opciones: Opcion[] | null;
}

export interface Test {
    id: number;
    titulo: string;
    descripcion?: string;
    categoria: string;
    dificultad: 'BAJA' | 'MEDIA' | 'ALTA';
    tiempoLimite?: number;
    visibilidad: 'PUBLICO' | 'PRIVADO' | 'ORGANIZACION';
    activo: boolean;
    organizacion?: { id: number; nombre: string } | null;
    creador?: {
        id: number;
        nombre: string;
        email: string;
    } | null;
    preguntas: Pregunta[] | null;
}