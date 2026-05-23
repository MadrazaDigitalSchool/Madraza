import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Test } from '../models/test.model';

export interface Categoria {
  id: number;
  nombre: string;
}

export interface CreateTestDTO {
  titulo: string;
  descripcion?: string | null;
  categoria: string;
  dificultad: 'BAJA' | 'MEDIA' | 'ALTA';
  tiempoLimite?: number | null;
  visibilidad: 'PUBLICO' | 'PRIVADO' | 'ORGANIZACION';
  organizacionId?: number | null;
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

  getTestsPublicos(): Observable<Test[]> {
    return this.http.get<Test[]>(this.apiUrl);
  }

  getTestById(id: number): Observable<Test> {
    return this.http.get<Test>(`${this.apiUrl}/${id}`);
  }

  getMisTests(): Observable<Test[]> {
    return this.http.get<Test[]>(`${this.apiUrl}/mis-tests`);
  }

  crearTest(test: CreateTestDTO): Observable<Test> {
    return this.http.post<Test>(this.apiUrl, test);
  }

  actualizarTest(id: number, test: CreateTestDTO): Observable<Test> {
    return this.http.put<Test>(`${this.apiUrl}/${id}`, test);
  }

  eliminarTest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getDependencias(id: number): Observable<{ asignaciones: number; apuntesAsociados: number }> {
    return this.http.get<{ asignaciones: number; apuntesAsociados: number }>(`${this.apiUrl}/${id}/dependencias`);
  }

  getTestsOrganizacion(orgId: number): Observable<Test[]> {
    return this.http.get<Test[]>(`${this.apiUrl}/organizacion/${orgId}`);
  }

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${environment.apiUrl}/categorias`);
  }

  crearCategoria(nombre: string): Observable<Categoria> {
    return this.http.post<Categoria>(`${environment.apiUrl}/categorias`, { nombre });
  }

  exportarPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }
}