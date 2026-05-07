import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private apiUrl = `${environment.apiUrl}/pago`;

  constructor(private http: HttpClient) {}

  /** Crea Customer + Subscription incompleta; devuelve clientSecret y subscriptionId para Stripe.js */
  crearIntencion(plan: 'mensual' | 'anual'): Observable<{ clientSecret: string; subscriptionId: string }> {
    return this.http.post<{ clientSecret: string; subscriptionId: string }>(
      `${this.apiUrl}/crear-intencion`, { plan }
    );
  }

  /** Verifica con Stripe que la suscripción está activa y activa la cuenta */
  confirmarSuscripcion(subscriptionId: string): Observable<{ suscripcionActiva: boolean; mensaje: string }> {
    return this.http.post<{ suscripcionActiva: boolean; mensaje: string }>(
      `${this.apiUrl}/confirmar-suscripcion`, { subscriptionId }
    );
  }

  /** @deprecated Usar crearIntencion(). Mantener para compatibilidad con webhook */
  crearSesion(plan: 'mensual' | 'anual', metodoPago: string = 'tarjeta'): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/crear-sesion`, { plan, metodoPago });
  }

  /** @deprecated Usar confirmarSuscripcion(). Mantener para flujo de redirect 3DS */
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
