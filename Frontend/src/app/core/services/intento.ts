import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Intento, RespuestaRequest, ResultadoResponse } from '../models/intento.model';

/**
 * Servicio de intentos — gestiona el modo examen completo:
 * iniciar, responder preguntas y finalizar el examen.
 * @author Hafdala Mehdi Sidi
 */
@Injectable({
  providedIn: 'root'
})
export class IntentoService {

  private apiUrl = `${environment.apiUrl}/intentos`;

  constructor(private http: HttpClient) { }

  /**
   * Inicia un nuevo intento para el test indicado
   * Devuelve el intento creado con estado EN_CURSO
   */
  iniciarIntento(testId: number): Observable<Intento> {
    return this.http.post<Intento>(`${this.apiUrl}/test/${testId}`, {});
  }

  /**
   * Envía la respuesta del usuario a una pregunta concreta
   */
  responder(intentoId: number, respuesta: RespuestaRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${intentoId}/responder`, respuesta);
  }

  /**
   * Finaliza el intento y obtiene el resultado completo
   * con puntuación, correctas, incorrectas y porcentaje
   */
  finalizar(intentoId: number): Observable<ResultadoResponse> {
    return this.http.post<ResultadoResponse>(`${this.apiUrl}/${intentoId}/finalizar`, {});
  }

  /**
   * Obtiene el historial de intentos del usuario autenticado
   * ordenado del más reciente al más antiguo
   */
  getHistorial(): Observable<Intento[]> {
    return this.http.get<Intento[]>(`${this.apiUrl}/historial`);
  }
}