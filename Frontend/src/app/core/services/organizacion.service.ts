import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Organizacion {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  codigoInvitacion: string;
  adminId: number;
  adminNombre: string;
  activa: boolean;
  createdAt: string;
  miembros?: Miembro[];
  asignaciones?: AsignacionOrg[];
}

export interface Miembro {
  id: number;
  usuarioId: number;
  nombre: string;
  apellidos: string;
  email: string;
  rol: string;
  fechaUnion: string;
}

export interface AsignacionOrg {
  id: number;
  tipoRecurso: 'TEST' | 'APUNTE';
  testId: number | null;
  testTitulo: string | null;
  apunteId: number | null;
  apunteTitulo: string | null;
  asignadoPorNombre: string;
  fechaAsignacion: string;
  fechaLimite: string | null;
  instrucciones: string;
  activa: boolean;
  destinatarioId: number | null;
  destinatarioNombre: string | null;
}

export interface ResultadoAsignacion {
  usuarioId: number;
  nombre: string;
  email: string;
  estado: string;
  fechaCompletado: string | null;
  porcentaje: number | null;
  correctas: number | null;
  totalPreguntas: number | null;
  puntuacion: number | null;
  estadoIntento: string | null;
}

export interface EstadisticasMiembro {
  usuarioId: number;
  nombre: string;
  email: string;
  total: number;
  completadas: number;
  pendientes: number;
  mediaAciertos: number;
  asignaciones: {
    asignacionId: number;
    titulo: string;
    estado: string;
    fechaLimite: string | null;
    fechaCompletado: string | null;
    porcentaje?: number;
    correctas?: number;
    totalPreguntas?: number;
  }[];
}

export interface MiAsignacion {
  id: number;
  asignacionId: number;
  tipoRecurso: 'TEST' | 'APUNTE';
  testId: number | null;
  testTitulo: string | null;
  apunteId: number | null;
  apunteTitulo: string | null;
  orgNombre: string;
  asignadoPor: string;
  instrucciones: string;
  fechaLimite: string | null;
  estado: string;
  fechaCompletado: string | null;
}

@Injectable({ providedIn: 'root' })
export class OrganizacionService {

  private apiUrl      = `${environment.apiUrl}/organizaciones`;
  private asigUrl     = `${environment.apiUrl}/asignaciones`;

  constructor(private http: HttpClient) {}

  getMisOrganizaciones(): Observable<Organizacion[]> {
    return this.http.get<Organizacion[]>(this.apiUrl);
  }

  crear(nombre: string, tipo: string, descripcion: string): Observable<Organizacion> {
    return this.http.post<Organizacion>(this.apiUrl, { nombre, tipo, descripcion });
  }

  getById(id: number): Observable<Organizacion> {
    return this.http.get<Organizacion>(`${this.apiUrl}/${id}`);
  }

  actualizar(id: number, datos: Partial<Organizacion>): Observable<Organizacion> {
    return this.http.put<Organizacion>(`${this.apiUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  invitar(orgId: number, email: string): Observable<Miembro> {
    return this.http.post<Miembro>(`${this.apiUrl}/${orgId}/invitar`, { email });
  }

  expulsar(orgId: number, usuarioId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${orgId}/miembros/${usuarioId}`);
  }

  unirsePorCodigo(codigo: string): Observable<Organizacion> {
    return this.http.get<Organizacion>(`${this.apiUrl}/unirse/${codigo}`);
  }

  asignarRecurso(orgId: number, tipoRecurso: 'TEST' | 'APUNTE',
                 testId: number | null, apunteId: number | null,
                 fechaLimite: string | null, instrucciones: string,
                 usuarioId?: number | null): Observable<AsignacionOrg> {
    return this.http.post<AsignacionOrg>(`${this.apiUrl}/${orgId}/asignar`,
      { tipoRecurso, testId, apunteId, fechaLimite, instrucciones, usuarioId: usuarioId ?? null });
  }

  getResultadosAsignacion(orgId: number, asignacionId: number): Observable<ResultadoAsignacion[]> {
    return this.http.get<ResultadoAsignacion[]>(`${this.apiUrl}/${orgId}/asignaciones/${asignacionId}/resultados`);
  }

  getEstadisticasMiembro(orgId: number, miembroId: number): Observable<EstadisticasMiembro> {
    return this.http.get<EstadisticasMiembro>(`${this.apiUrl}/${orgId}/miembros/${miembroId}/stats`);
  }

  getMisAsignaciones(): Observable<MiAsignacion[]> {
    return this.http.get<MiAsignacion[]>(`${this.asigUrl}/mis-asignaciones`);
  }

  completarAsignacion(id: number, intentoId?: number): Observable<MiAsignacion> {
    return this.http.put<MiAsignacion>(`${this.asigUrl}/${id}/completar`, { intentoId });
  }
}
