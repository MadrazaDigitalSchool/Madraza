import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Apunte {
  id: number;
  titulo: string;
  contenido: string;
  tags: string;
  testId: number | null;
  testTitulo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IaRequest {
  modo: 'asistente' | 'generacion';
  accion?: 'ampliar' | 'resumir' | 'preguntas' | 'explicar';
  contenidoActual?: string;
  textoSeleccionado?: string;
  tema?: string;
  contexto?: string;
}

@Injectable({ providedIn: 'root' })
export class ApunteService {

  private apiUrl = `${environment.apiUrl}/apuntes`;

  constructor(private http: HttpClient) {}

  getMisApuntes(): Observable<Apunte[]> {
    return this.http.get<Apunte[]>(this.apiUrl);
  }

  getApuntesPorTest(testId: number): Observable<Apunte[]> {
    return this.http.get<Apunte[]>(`${this.apiUrl}/test/${testId}`);
  }

  crear(datos: Partial<Apunte>): Observable<Apunte> {
    return this.http.post<Apunte>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: Partial<Apunte>): Observable<Apunte> {
    return this.http.put<Apunte>(`${this.apiUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  asistirConIa(req: IaRequest): Observable<{ resultado: string }> {
    return this.http.post<{ resultado: string }>(`${this.apiUrl}/ia`, req);
  }
}
