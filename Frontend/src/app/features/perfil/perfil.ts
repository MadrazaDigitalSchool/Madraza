import { Component, OnInit, inject, DestroyRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth';
import { TestService } from '../../core/services/test';
import { PaymentService } from '../../core/services/payment.service';
import { Usuario } from '../../core/models/usuario.model';
import { Test } from '../../core/models/test.model';
import { environment } from '../../../environments/environment';
import { CrearCategoriaDialogComponent } from '../../shared/components/crear-categoria-dialog/crear-categoria-dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { loadStripe, Stripe, StripeElements, StripePaymentElement } from '@stripe/stripe-js';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatDividerModule, MatChipsModule, MatSelectModule
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class PerfilComponent implements OnInit {
  authService     = inject(AuthService);
  private testService    = inject(TestService);
  private paymentService = inject(PaymentService);
  private router    = inject(Router);
  private dialog    = inject(MatDialog);
  private snackBar  = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  usuario = signal<Usuario | null>(null);
  nombre = '';
  apellidos = '';
  email = '';
  metodoPago = '';
  planTipo = '';
  guardando = signal(false);
  guardado = signal(false);
  error = signal('');
  cargando = signal(true);

  misTests: Test[] = [];
  misTestsCargando = true;
  eliminandoId: number | null = null;

  // ── Cambio de método de pago (signals para detectar cambios fuera de zone) ──
  modoMetodoPago    = signal(false);
  cargandoSetup     = signal(false);
  confirmandoMetodo = signal(false);
  errorMetodo       = signal('');
  nuevoMetodoPago   = 'tarjeta';

  readonly METODOS_PAGO = [
    { value: 'tarjeta',    label: 'Tarjeta (Visa / Mastercard / Amex)' },
    { value: 'paypal',     label: 'PayPal'       },
    { value: 'apple_pay',  label: 'Apple Pay'    },
    { value: 'google_pay', label: 'Google Pay'   },
    { value: 'sepa',       label: 'Adeudo SEPA'  },
  ];

  private stripe: Stripe | null = null;
  private elementsSetup: StripeElements | null = null;
  private paymentElementSetup: StripePaymentElement | null = null;

  fechaExpiry = computed(() => {
    const u = this.usuario();
    if (!u?.suscripcionExpiry) return null;
    return new Date(u.suscripcionExpiry);
  });

  esPremium = computed(() => {
    const u = this.usuario();
    if (!u?.suscripcionActiva) return false;
    const expiry = this.fechaExpiry();
    if (expiry) return expiry > new Date();
    return true;
  });

  diasRestantes = computed(() => {
    const expiry = this.fechaExpiry();
    if (!expiry) return null;
    const diff = expiry.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  });

  ngOnInit(): void {
    const cached = this.authService.getUsuarioActual();
    if (cached) this.aplicarUsuario(cached);

    this.authService.getPerfil().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (u) => this.aplicarUsuario(u),
      error: () => this.cargando.set(false)
    });

    this.cargarMisTests();
  }

  private aplicarUsuario(u: Usuario): void {
    this.usuario.set(u);
    this.nombre = u.nombre ?? '';
    this.apellidos = u.apellidos ?? '';
    this.email = u.email ?? '';
    this.metodoPago = u.metodoPago ?? '';
    this.planTipo = u.planTipo ?? '';
    this.cargando.set(false);
  }

  cargarMisTests(): void {
    this.misTestsCargando = true;
    this.testService.getMisTests().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (tests) => {
        this.misTests = tests;
        this.misTestsCargando = false;
      },
      error: () => { this.misTestsCargando = false; }
    });
  }

  editarTest(test: Test): void {
    this.router.navigate(['/tests/editar', test.id]);
  }

  eliminarTest(test: Test): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '380px',
      data: {
        titulo: 'Eliminar test',
        mensaje: `¿Seguro que quieres eliminar "${test.titulo}"? Esta acción no se puede deshacer.`,
        labelConfirmar: 'Eliminar',
        labelCancelar: 'Cancelar'
      }
    });
    ref.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      this.eliminandoId = test.id;
      this.testService.eliminarTest(test.id).subscribe({
        next: () => {
          this.misTests = this.misTests.filter(t => t.id !== test.id);
          this.eliminandoId = null;
          this.snackBar.open(`Test "${test.titulo}" eliminado correctamente.`, 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.eliminandoId = null;
          this.snackBar.open('No se pudo eliminar el test. Inténtalo de nuevo.', 'Cerrar', { duration: 4000 });
        }
      });
    });
  }

  abrirDialogoCategoria(): void {
    const ref = this.dialog.open(CrearCategoriaDialogComponent, { width: '400px' });
    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.testService.crearCategoria(result).subscribe({
        next: () => {
          this.snackBar.open(`Categoría "${result}" creada.`, 'Cerrar', { duration: 3000 });
        },
        error: (err) => {
          const msg = err.error?.error || 'No se pudo crear la categoría.';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
        }
      });
    });
  }

  getIniciales(): string {
    if (this.nombre) return this.nombre.charAt(0).toUpperCase();
    if (this.apellidos) return this.apellidos.charAt(0).toUpperCase();
    return 'U';
  }

  getPlanLabel(): string {
    const p = this.planTipo?.toLowerCase();
    if (p === 'anual')   return 'Premium Anual';
    if (p === 'mensual') return 'Premium Mensual';
    return 'Premium';
  }

  getMetodoPagoLabel(): string {
    const labels: Record<string, string> = {
      tarjeta: 'Tarjeta',
      paypal: 'PayPal',
      card: 'Tarjeta',
      apple_pay: 'Apple Pay',
      google_pay: 'Google Pay',
      sepa: 'Adeudo SEPA',
      sepa_debit: 'Adeudo SEPA',
      klarna: 'Klarna',
      bizum: 'Bizum'
    };
    return labels[this.metodoPago] || this.metodoPago;
  }

  isAdmin(): boolean {
    return this.authService.tieneRol('ROLE_ADMIN');
  }

  getDificultadClass(dificultad: string): string {
    const clases: Record<string, string> = { 'BAJA': 'chip-baja', 'MEDIA': 'chip-media', 'ALTA': 'chip-alta' };
    return clases[dificultad] ?? '';
  }

  getDificultadLabel(dificultad: string): string {
    const labels: Record<string, string> = { 'BAJA': 'Fácil', 'MEDIA': 'Media', 'ALTA': 'Difícil' };
    return labels[dificultad] ?? dificultad;
  }

  // ── Cambio de método de pago ──────────────────────────────

  async iniciarCambioMetodo(): Promise<void> {
    this.modoMetodoPago.set(true);
    this.cargandoSetup.set(true);
    this.errorMetodo.set('');

    try {
      const { clientSecret } = await firstValueFrom(this.paymentService.crearSetupIntent());
      const stripe = await loadStripe(environment.stripePublicKey);
      if (!stripe) throw new Error('No se pudo cargar Stripe');

      this.stripe = stripe;
      this.elementsSetup = stripe.elements({ clientSecret, locale: 'es' });
      this.paymentElementSetup = this.elementsSetup.create('payment', {
        layout: { type: 'tabs', defaultCollapsed: false },
        wallets: { applePay: 'never', googlePay: 'never' },
      } as any);

      // El div #cambio-metodo-element está siempre en el DOM ([hidden]) → mount inmediato
      this.paymentElementSetup!.mount('#cambio-metodo-element');
      this.cargandoSetup.set(false);  // Revela el formulario ya montado
    } catch (err: any) {
      this.cargandoSetup.set(false);
      this.errorMetodo.set(err?.error?.error ?? 'No se pudo cargar el formulario. Inténtalo de nuevo.');
    }
  }

  async confirmarCambioMetodo(): Promise<void> {
    if (!this.stripe || !this.elementsSetup) return;
    this.confirmandoMetodo.set(true);
    this.errorMetodo.set('');

    const { setupIntent, error } = await this.stripe.confirmSetup({
      elements: this.elementsSetup,
      confirmParams: { return_url: `${window.location.origin}/perfil` },
      redirect: 'if_required',
    } as any);

    if (error) {
      this.errorMetodo.set(error.message || 'Error al confirmar el método de pago.');
      this.confirmandoMetodo.set(false);
      return;
    }

    const paymentMethodId = (setupIntent as any)?.payment_method as string;
    this.paymentService.actualizarMetodoPago(paymentMethodId, this.nuevoMetodoPago)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.authService.getPerfil())
      )
      .subscribe({
        next: (u) => {
          this.aplicarUsuario(u);
          this.snackBar.open('Método de pago actualizado para el próximo período de facturación.', 'Cerrar', { duration: 4000 });
          this.cancelarCambioMetodo();
          this.confirmandoMetodo.set(false);
        },
        error: (err) => {
          this.errorMetodo.set(err?.error?.error ?? 'No se pudo actualizar el método de pago en el servidor.');
          this.confirmandoMetodo.set(false);
        }
      });
  }

  cancelarCambioMetodo(): void {
    this.paymentElementSetup?.unmount();
    this.paymentElementSetup = null;
    this.elementsSetup       = null;
    this.stripe              = null;
    this.modoMetodoPago.set(false);
    this.errorMetodo.set('');
  }

  guardarPerfil(): void {
    if (!this.nombre.trim()) return;

    this.guardando.set(true);
    this.error.set('');

    this.authService.actualizarPerfil({
      nombre: this.nombre.trim(),
      apellidos: this.apellidos.trim()
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (u) => {
        this.guardando.set(false);
        this.guardado.set(true);
        const actual = this.authService.getUsuarioActual();
        const actualizado: Usuario = { ...actual!, nombre: u.nombre, apellidos: u.apellidos };
        this.authService.guardarUsuarioLocal(actualizado);
        this.usuario.update(us => ({ ...us!, nombre: u.nombre, apellidos: u.apellidos }));
        setTimeout(() => this.guardado.set(false), 3000);
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('No se pudo actualizar el perfil. Inténtalo de nuevo.');
      }
    });
  }
}
