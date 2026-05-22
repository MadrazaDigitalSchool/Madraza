import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Intento, RespuestaRequest, ResultadoResponse, DetalleRespuesta, IntentoParaCorregir, PendienteCorreccion } from '../models/intento.model';

@Injectable({
  providedIn: 'root'
})
export class IntentoService {

  private apiUrl = `${environment.apiUrl}/intentos`;

  constructor(private http: HttpClient) { }

  iniciarIntento(testId: number): Observable<Intento> {
    return this.http.post<Intento>(`${this.apiUrl}/test/${testId}`, {});
  }

  responder(intentoId: number, respuesta: RespuestaRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${intentoId}/responder`, respuesta);
  }

  finalizar(intentoId: number): Observable<ResultadoResponse> {
    return this.http.post<ResultadoResponse>(`${this.apiUrl}/${intentoId}/finalizar`, {});
  }

  getHistorial(): Observable<Intento[]> {
    return this.http.get<Intento[]>(`${this.apiUrl}/historial`);
  }

  getDetalle(intentoId: number): Observable<DetalleRespuesta[]> {
    return this.http.get<DetalleRespuesta[]>(`${this.apiUrl}/${intentoId}/detalle`);
  }

  getMisPendientesCorreccion(): Observable<PendienteCorreccion[]> {
    return this.http.get<PendienteCorreccion[]>(`${this.apiUrl}/mis-pendientes-correccion`);
  }

  getParaCorregir(testId: number): Observable<IntentoParaCorregir[]> {
    return this.http.get<IntentoParaCorregir[]>(`${this.apiUrl}/para-corregir/${testId}`);
  }

  corregir(intentoId: number, correcciones: Record<number, boolean>): Observable<ResultadoResponse> {
    return this.http.put<ResultadoResponse>(`${this.apiUrl}/${intentoId}/corregir`, correcciones);
  }
}