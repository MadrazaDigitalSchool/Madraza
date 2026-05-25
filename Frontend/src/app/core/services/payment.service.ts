import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private apiUrl = `${environment.apiUrl}/pago`;

  constructor(private http: HttpClient) {}

  /** Crea Customer + Subscription incompleta; devuelve clientSecret y subscriptionId para Stripe.js */
  crearIntencion(
    plan: 'mensual' | 'anual',
    metodoPago: string = 'card'
  ): Observable<{ clientSecret: string; subscriptionId: string }> {
    return this.http.post<{ clientSecret: string; subscriptionId: string }>(
      `${this.apiUrl}/crear-intencion`, { plan, metodoPago }
    );
  }

  /** Verifica con Stripe que la suscripción está activa y activa la cuenta */
  confirmarSuscripcion(subscriptionId: string): Observable<{ suscripcionActiva: boolean; mensaje: string }> {
    return this.http.post<{ suscripcionActiva: boolean; mensaje: string }>(
      `${this.apiUrl}/confirmar-suscripcion`, { subscriptionId }
    );
  }

  /** Crea una sesión Stripe Checkout para Bizum y Klarna (métodos que requieren redirección externa) */
  crearSesion(plan: 'mensual' | 'anual', metodoPago: string): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.apiUrl}/crear-sesion`, { plan, metodoPago });
  }

  verificarSesion(sessionId: string): Observable<{ suscripcionActiva: boolean; mensaje: string }> {
    return this.http.post<{ suscripcionActiva: boolean; mensaje: string }>(
      `${this.apiUrl}/verificar-sesion`, { sessionId }
    );
  }

  getEstado(): Observable<{ suscripcionActiva: boolean; suscripcionExpiry: string }> {
    return this.http.get<{ suscripcionActiva: boolean; suscripcionExpiry: string }>(
      `${this.apiUrl}/estado`
    );
  }

  /** Crea un SetupIntent para capturar un nuevo método de pago sin cobrar */
  crearSetupIntent(): Observable<{ clientSecret: string }> {
    return this.http.post<{ clientSecret: string }>(`${this.apiUrl}/setup-intent`, {});
  }

  /** Actualiza el método de pago por defecto en Stripe y en la BD */
  actualizarMetodoPago(paymentMethodId: string, metodoPago: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/metodo-pago`, { paymentMethodId, metodoPago });
  }

  /** Cambia el plan activo entre mensual y anual */
  cambiarPlan(plan: 'mensual' | 'anual'): Observable<{ planTipo: string; suscripcionExpiry: string; mensaje: string }> {
    return this.http.put<{ planTipo: string; suscripcionExpiry: string; mensaje: string }>(
      `${this.apiUrl}/cambiar-plan`, { plan }
    );
  }

  /** Cancela la suscripción activa; el acceso se mantiene hasta fin del período pagado */
  cancelarSuscripcion(): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/suscripcion`);
  }
}
