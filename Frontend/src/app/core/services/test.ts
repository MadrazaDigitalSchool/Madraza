import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Test } from '../models/test.model';

export interface Categoria {
  id: number;
  nombre: string;
}

/**
 * Servicio de tests — gestiona todas las llamadas al backend
 * relacionadas con los tests, preguntas y opciones.
 * @author Hafdala Mehdi Sidi
 */
export interface CreateTestDTO {
  titulo: string;
  descripcion?: string | null;
  categoria: string;
  dificultad: 'BAJA' | 'MEDIA' | 'ALTA';
  tiempoLimite?: number | null;
  visibilidad: 'PUBLICO' | 'PRIVADO';
  preguntas: {
    enunciado: string;
    tipo: 'OPCION_MULTIPLE' | 'VERDADERO_FALSO' | 'TEXTO_LIBRE';
    orden: number;
    puntos: number;
    explicacion?: string | null;
    opciones: { texto: string; esCorrecta: boolean; orden: number }[];
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class TestService {

  private apiUrl = `${environment.apiUrl}/tests`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todos los tests públicos
   * No requiere autenticación
   */
  getTestsPublicos(): Observable<Test[]> {
    return this.http.get<Test[]>(this.apiUrl);
  }

  /**
   * Obtiene un test completo con sus preguntas y opciones por ID
   */
  getTestById(id: number): Observable<Test> {
    return this.http.get<Test>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene los tests creados por el usuario autenticado
   * Requiere token JWT
   */
  getMisTests(): Observable<Test[]> {
    return this.http.get<Test[]>(`${this.apiUrl}/mis-tests`);
  }

  /**
   * Crea un nuevo test con preguntas y opciones
   * Requiere token JWT
   */
  crearTest(test: CreateTestDTO): Observable<Test> {
    return this.http.post<Test>(this.apiUrl, test);
  }

  /**
   * Actualiza un test existente (requiere ser el creador)
   */
  actualizarTest(id: number, test: CreateTestDTO): Observable<Test> {
    return this.http.put<Test>(`${this.apiUrl}/${id}`, test);
  }

  /**
   * Elimina un test por su ID
   */
  eliminarTest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtiene todas las categorías disponibles
   */
  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${environment.apiUrl}/categorias`);
  }

  /**
   * Crea una nueva categoría
   */
  crearCategoria(nombre: string): Observable<Categoria> {
    return this.http.post<Categoria>(`${environment.apiUrl}/categorias`, { nombre });
  }
}