import { Component, OnInit, inject, DestroyRef, computed, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth';
import { TestService } from '../../core/services/test';
import { Usuario } from '../../core/models/usuario.model';
import { Test } from '../../core/models/test.model';
import { CrearCategoriaDialogComponent } from '../../shared/components/crear-categoria-dialog/crear-categoria-dialog';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule, RouterLink,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatProgressSpinnerModule, MatDividerModule, MatChipsModule
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss'
})
export class PerfilComponent implements OnInit {
  authService     = inject(AuthService);
  private testService    = inject(TestService);
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

  planExpirandoPronto = computed(() => {
    if (!this.esPremium()) return false;
    const dias = this.diasRestantes();
    return dias !== null && dias <= 7;
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

  private readonly NOMBRE_REGEX = /^[a-zA-ZÀ-ÿñÑ'\s-]+$/;

  guardarPerfil(): void {
    const nombre    = this.nombre.trim();
    const apellidos = this.apellidos.trim();

    if (!nombre) {
      this.error.set('El nombre es obligatorio');
      return;
    }
    if (!this.NOMBRE_REGEX.test(nombre)) {
      this.error.set('El nombre solo puede contener letras, espacios y guiones');
      return;
    }
    if (apellidos && !this.NOMBRE_REGEX.test(apellidos)) {
      this.error.set('Los apellidos solo pueden contener letras, espacios y guiones');
      return;
    }

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
