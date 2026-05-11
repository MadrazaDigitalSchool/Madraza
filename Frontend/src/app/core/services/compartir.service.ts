import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CompartirTest {
  id: number;
  testId: number;
  testTitulo: string;
  remitenteNombre: string;
  remitenteEmail: string;
  destinatarioEmail: string;
  mensaje: string;
  visto: boolean;
  fechaCompartido: string;
}

@Injectable({ providedIn: 'root' })
export class CompartirService {

  private apiUrl = `${environment.apiUrl}/compartir`;

  constructor(private http: HttpClient) {}

  compartir(testId: number, email: string, mensaje: string): Observable<CompartirTest> {
    return this.http.post<CompartirTest>(`${this.apiUrl}/${testId}`, { email, mensaje });
  }

  getRecibidos(): Observable<CompartirTest[]> {
    return this.http.get<CompartirTest[]>(`${this.apiUrl}/recibidos`);
  }

  getEnviados(): Observable<CompartirTest[]> {
    return this.http.get<CompartirTest[]>(`${this.apiUrl}/enviados`);
  }

  marcarVisto(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/visto`, {});
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getNoVistos(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/no-vistos`);
  }
}
