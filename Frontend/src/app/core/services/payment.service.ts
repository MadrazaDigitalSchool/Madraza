import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private apiUrl = `${environment.apiUrl}/pago`;

  constructor(private http: HttpClient) {}

  /** Crea una sesión de Stripe Checkout y devuelve la URL de pago */
  crearSesion(plan: 'mensual' | 'anual'): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/crear-sesion`, { plan });
  }

  /** Verifica el pago con el sessionId de Stripe y activa la suscripción */
  verificarSesion(sessionId: string): Observable<{ suscripcionActiva: boolean; mensaje: string }> {
    return this.http.post<{ suscripcionActiva: boolean; mensaje: string }>(
      `${this.apiUrl}/verificar-sesion`, { sessionId }
    );
  }

  /** Devuelve el estado actual de la suscripción del usuario */
  getEstado(): Observable<{ suscripcionActiva: boolean; suscripcionExpiry: string }> {
    return this.http.get<{ suscripcionActiva: boolean; suscripcionExpiry: string }>(
      `${this.apiUrl}/estado`
    );
  }
}
