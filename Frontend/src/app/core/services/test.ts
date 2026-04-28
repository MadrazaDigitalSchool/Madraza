import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Test } from '../models/test.model';

/**
 * Servicio de tests — gestiona todas las llamadas al backend
 * relacionadas con los tests, preguntas y opciones.
 * @author Hafdala Mehdi Sidi
 */
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
  crearTest(test: any): Observable<Test> {
    return this.http.post<Test>(this.apiUrl, test);
  }

  /**
   * Elimina un test por su ID
   * Requiere token JWT
   */
  eliminarTest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}