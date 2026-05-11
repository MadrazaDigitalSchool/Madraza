import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminStats {
  totalUsuarios: number;
  suscripcionesActivas: number;
  totalTests: number;
  totalIntentos: number;
}

export interface AdminUsuario {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  emailVerificado: boolean;
  suscripcionActiva: boolean;
  suscripcionExpiry: string | null;
  planTipo: string | null;
  metodoPago: string | null;
  activo: boolean;
  proveedorOauth: string | null;
  createdAt: string | null;
  roles: string[];
}

export interface AdminTest {
  id: number;
  titulo: string;
  categoria: string;
  dificultad: string;
  visibilidad: 'PUBLICO' | 'PRIVADO';
  activo: boolean;
  totalPreguntas: number;
  creador: string;
}

export interface UsuarioFormData {
  nombre: string;
  apellidos: string;
  email: string;
  password?: string;
  rol: string;
  planTipo: string | null;
  metodoPago: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminService {

  private apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${this.apiUrl}/stats`);
  }

  getUsuarios(): Observable<AdminUsuario[]> {
    return this.http.get<AdminUsuario[]>(`${this.apiUrl}/usuarios`);
  }

  crearUsuario(datos: UsuarioFormData): Observable<AdminUsuario> {
    return this.http.post<AdminUsuario>(`${this.apiUrl}/usuarios`, datos);
  }

  updateUsuario(id: number, datos: Partial<UsuarioFormData>): Observable<AdminUsuario> {
    return this.http.put<AdminUsuario>(`${this.apiUrl}/usuarios/${id}`, datos);
  }

  updateSuscripcion(id: number, suscripcionActiva: boolean, dias?: number): Observable<any> {
    const body: any = { suscripcionActiva };
    if (suscripcionActiva && dias) body['dias'] = dias;
    return this.http.put(`${this.apiUrl}/usuarios/${id}/suscripcion`, body);
  }

  updateActivo(id: number, activo: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/usuarios/${id}/activo`, { activo });
  }

  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/usuarios/${id}`);
  }

  getTests(): Observable<AdminTest[]> {
    return this.http.get<AdminTest[]>(`${this.apiUrl}/tests`);
  }

  updateTestActivo(id: number, activo: boolean): Observable<any> {
    return this.http.put(`${this.apiUrl}/tests/${id}/activo`, { activo });
  }

  updateTestVisibilidad(id: number, visibilidad: 'PUBLICO' | 'PRIVADO'): Observable<any> {
    return this.http.put(`${this.apiUrl}/tests/${id}/visibilidad`, { visibilidad });
  }

  deleteTest(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tests/${id}`);
  }
}
