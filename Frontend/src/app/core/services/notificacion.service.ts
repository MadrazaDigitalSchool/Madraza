import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notificacion } from '../models/notificacion.model';

@Injectable({ providedIn: 'root' })
export class NotificacionService {

  private http   = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/notificaciones`;

  getAll(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(this.apiUrl);
  }

  getNoLeidas(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/no-leidas`);
  }

  marcarLeida(id: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/leer`, {});
  }

  marcarTodasLeidas(): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/leer-todas`, {});
  }

  eliminarTodas(): Observable<void> {
    return this.http.delete<void>(this.apiUrl);
  }
}
