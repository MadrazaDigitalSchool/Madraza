import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import {
  AdminService, AdminStats, AdminUsuario, AdminTest
} from '../../core/services/admin.service';
import { AuthService } from '../../core/services/auth';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

type Tab = 'resumen' | 'usuarios' | 'tests';
type ModoForm = 'crear' | 'editar' | null;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatChipsModule, MatFormFieldModule, MatInputModule,
    MatTooltipModule, MatDividerModule, MatSelectModule
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {

  private adminService = inject(AdminService);
  private snackBar     = inject(MatSnackBar);
  private dialog       = inject(MatDialog);
  private authService  = inject(AuthService);
  private route        = inject(ActivatedRoute);

  // ── Tabs ──────────────────────────────────────────────────
  tabActiva = signal<Tab>('resumen');

  // ── Datos ─────────────────────────────────────────────────
  stats    = signal<AdminStats | null>(null);
  usuarios = signal<AdminUsuario[]>([]);
  tests    = signal<AdminTest[]>([]);

  cargandoStats    = signal(false);
  cargandoUsuarios = signal(false);
  cargandoTests    = signal(false);

  // ── Búsqueda ──────────────────────────────────────────────
  busquedaUsuario = signal('');
  busquedaTest    = signal('');

  usuariosFiltrados = computed(() => {
    const q = this.busquedaUsuario().toLowerCase();
    return this.usuarios().filter(u =>
      !q ||
      u.nombre.toLowerCase().includes(q) ||
      u.apellidos.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  testsFiltrados = computed(() => {
    const q = this.busquedaTest().toLowerCase();
    return this.tests().filter(t =>
      !q ||
      t.titulo.toLowerCase().includes(q) ||
      t.categoria.toLowerCase().includes(q) ||
      t.creador.toLowerCase().includes(q)
    );
  });

  // ── CRUD usuarios ─────────────────────────────────────────
  modoForm          = signal<ModoForm>(null);
  usuarioEditando   = signal<AdminUsuario | null>(null);
  guardandoUsuario  = signal(false);
  eliminandoId      = signal<number | null>(null);

  fNombre     = '';
  fApellidos  = '';
  fEmail      = '';
  fPassword   = '';
  fRol        = 'ROLE_USER';
  fPlanTipo   = '';
  fMetodoPago = '';

  readonly ROLES = [
    { value: 'ROLE_USER',   label: 'Usuario estándar',  icon: 'person'               },
    { value: 'ROLE_VIEWER', label: 'Solo ver',           icon: 'visibility'           },
    { value: 'ROLE_EDITOR', label: 'Editor',             icon: 'edit_note'            },
    { value: 'ROLE_ADMIN',  label: 'Administrador',      icon: 'admin_panel_settings' },
  ];

  ngOnInit(): void {
    this.cargarStats();
    const tab = this.route.snapshot.queryParamMap.get('tab') as Tab | null;
    if (tab && ['resumen', 'usuarios', 'tests'].includes(tab)) {
      this.setTab(tab);
    }
  }

  setTab(tab: Tab): void {
    this.tabActiva.set(tab);
    this.modoForm.set(null);
    if (tab === 'usuarios' && this.usuarios().length === 0) this.cargarUsuarios();
    if (tab === 'tests'    && this.tests().length    === 0) this.cargarTests();
  }

  cargarStats(): void {
    this.cargandoStats.set(true);
    this.adminService.getStats().subscribe({
      next: s => { this.stats.set(s); this.cargandoStats.set(false); },
      error: () => this.cargandoStats.set(false)
    });
  }

  cargarUsuarios(): void {
    this.cargandoUsuarios.set(true);
    this.adminService.getUsuarios().subscribe({
      next: u => { this.usuarios.set(u); this.cargandoUsuarios.set(false); },
      error: () => this.cargandoUsuarios.set(false)
    });
  }

  cargarTests(): void {
    this.cargandoTests.set(true);
    this.adminService.getTests().subscribe({
      next: t => { this.tests.set(t); this.cargandoTests.set(false); },
      error: () => this.cargandoTests.set(false)
    });
  }

  abrirCrear(): void {
    this.resetForm();
    this.usuarioEditando.set(null);
    this.modoForm.set('crear');
  }

  abrirEditar(u: AdminUsuario): void {
    this.fNombre     = u.nombre;
    this.fApellidos  = u.apellidos;
    this.fEmail      = u.email;
    this.fPassword   = '';
    this.fRol        = u.roles.find(r => this.ROLES.some(x => x.value === r)) ?? 'ROLE_USER';
    this.fPlanTipo   = u.planTipo ?? '';
    this.fMetodoPago = u.metodoPago ?? '';
    this.usuarioEditando.set(u);
    this.modoForm.set('editar');
    // setTimeout 0 para esperar a que Angular renderice el formulario antes de hacer scroll
    setTimeout(() => document.getElementById('usuario-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  cancelarForm(): void {
    this.modoForm.set(null);
    this.usuarioEditando.set(null);
    this.resetForm();
  }

  private readonly NOMBRE_REGEX = /^[a-zA-ZÀ-ÿñÑ'\s-]+$/;
  private readonly EMAIL_REGEX  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  guardarUsuario(): void {
    const nombre  = this.fNombre.trim();
    const email   = this.fEmail.trim();

    if (!nombre || !email) {
      this.snackBar.open('Nombre y email son obligatorios.', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!this.NOMBRE_REGEX.test(nombre)) {
      this.snackBar.open('El nombre solo puede contener letras, espacios y guiones.', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!this.EMAIL_REGEX.test(email)) {
      this.snackBar.open('Introduce un correo electrónico válido.', 'Cerrar', { duration: 3000 });
      return;
    }
    this.guardandoUsuario.set(true);

    if (this.modoForm() === 'crear') {
      if (!this.fPassword || this.fPassword.length < 8) {
        this.snackBar.open('La contraseña debe tener mínimo 8 caracteres.', 'Cerrar', { duration: 3000 });
        this.guardandoUsuario.set(false);
        return;
      }
      this.adminService.crearUsuario({
        nombre:     this.fNombre.trim(),
        apellidos:  this.fApellidos.trim(),
        email:      this.fEmail.trim(),
        password:   this.fPassword,
        rol:        this.fRol,
        planTipo:   this.fRol === 'ROLE_ADMIN' ? null : (this.fPlanTipo || null),
        metodoPago: this.fRol === 'ROLE_ADMIN' ? null : (this.fMetodoPago || null)
      }).subscribe({
        next: u => {
          this.usuarios.update(list => [u, ...list]);
          this.snackBar.open(`Usuario ${u.nombre} creado.`, 'Cerrar', { duration: 3000 });
          this.cancelarForm();
          this.guardandoUsuario.set(false);
        },
        error: (err) => {
          const msg = err?.error?.error ?? 'Error al crear el usuario.';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
          this.guardandoUsuario.set(false);
        }
      });

    } else {
      const original = this.usuarioEditando()!;
      this.adminService.updateUsuario(original.id, {
        nombre:     this.fNombre.trim(),
        apellidos:  this.fApellidos.trim(),
        email:      this.fEmail.trim(),
        rol:        this.fRol,
        planTipo:   this.fRol === 'ROLE_ADMIN' ? null : (this.fPlanTipo || null),
        metodoPago: this.fRol === 'ROLE_ADMIN' ? null : (this.fMetodoPago || null)
      }).subscribe({
        next: updated => {
          this.usuarios.update(list => list.map(u => u.id === updated.id ? { ...u, ...updated } : u));
          this.snackBar.open('Usuario actualizado.', 'Cerrar', { duration: 3000 });
          this.cancelarForm();
          this.guardandoUsuario.set(false);
        },
        error: (err) => {
          const msg = err?.error?.error ?? 'Error al actualizar el usuario.';
          this.snackBar.open(msg, 'Cerrar', { duration: 4000 });
          this.guardandoUsuario.set(false);
        }
      });
    }
  }

  eliminarUsuario(u: AdminUsuario): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Eliminar usuario',
        mensaje: `¿Eliminar a "${u.nombre} ${u.apellidos}"? Se borrarán todos sus datos, tests e intentos. Esta acción no se puede deshacer.`,
        labelConfirmar: 'Eliminar',
        labelCancelar: 'Cancelar'
      }
    });
    ref.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      this.eliminandoId.set(u.id);
      this.adminService.deleteUsuario(u.id).subscribe({
        next: () => {
          this.usuarios.update(list => list.filter(x => x.id !== u.id));
          this.snackBar.open(`Usuario "${u.nombre} ${u.apellidos}" eliminado correctamente.`, 'Cerrar', { duration: 3000 });
          this.eliminandoId.set(null);
          if (this.usuarioEditando()?.id === u.id) this.cancelarForm();
        },
        error: () => {
          this.snackBar.open('No se pudo eliminar el usuario. Inténtalo de nuevo.', 'Cerrar', { duration: 4000 });
          this.eliminandoId.set(null);
        }
      });
    });
  }

  activarSuscripcion(u: AdminUsuario, dias: 30 | 365): void {
    this.adminService.updateSuscripcion(u.id, true, dias).subscribe({
      next: res => this.usuarios.update(list =>
        list.map(x => x.id === u.id ? { ...x, suscripcionActiva: res.suscripcionActiva, suscripcionExpiry: res.suscripcionExpiry || null } : x))
    });
  }

  desactivarSuscripcion(u: AdminUsuario): void {
    this.adminService.updateSuscripcion(u.id, false).subscribe({
      next: () => this.usuarios.update(list =>
        list.map(x => x.id === u.id ? { ...x, suscripcionActiva: false, suscripcionExpiry: null } : x))
    });
  }

  toggleUsuarioActivo(u: AdminUsuario): void {
    const nuevo = !u.activo;
    this.adminService.updateActivo(u.id, nuevo).subscribe({
      next: () => this.usuarios.update(list =>
        list.map(x => x.id === u.id ? { ...x, activo: nuevo } : x))
    });
  }

  toggleTestActivo(t: AdminTest): void {
    const nuevo = !t.activo;
    this.adminService.updateTestActivo(t.id, nuevo).subscribe({
      next: () => this.tests.update(list =>
        list.map(x => x.id === t.id ? { ...x, activo: nuevo } : x))
    });
  }

  toggleTestVisibilidad(t: AdminTest): void {
    const nueva: 'PUBLICO' | 'PRIVADO' = t.visibilidad === 'PUBLICO' ? 'PRIVADO' : 'PUBLICO';
    this.adminService.updateTestVisibilidad(t.id, nueva).subscribe({
      next: () => {
        this.tests.update(list =>
          list.map(x => x.id === t.id ? { ...x, visibilidad: nueva } : x));
        const label = nueva === 'PUBLICO' ? 'publicado' : 'ocultado';
        this.snackBar.open(`Test "${t.titulo}" ${label}.`, 'Cerrar', { duration: 3000 });
      },
      error: () => this.snackBar.open('No se pudo cambiar la visibilidad.', 'Cerrar', { duration: 4000 })
    });
  }

  eliminarTest(t: AdminTest): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Eliminar test',
        mensaje: `¿Eliminar el test "${t.titulo}"? Se borrarán todas sus preguntas e intentos asociados. Esta acción no se puede deshacer.`,
        labelConfirmar: 'Eliminar',
        labelCancelar: 'Cancelar'
      }
    });
    ref.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      this.adminService.deleteTest(t.id).subscribe({
        next: () => {
          this.tests.update(list => list.filter(x => x.id !== t.id));
          this.snackBar.open(`Test "${t.titulo}" eliminado correctamente.`, 'Cerrar', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('No se pudo eliminar el test. Inténtalo de nuevo.', 'Cerrar', { duration: 4000 });
        }
      });
    });
  }

  esAdmin(u: AdminUsuario): boolean {
    return u.roles.includes('ROLE_ADMIN');
  }

  esSelf(u: AdminUsuario): boolean {
    return this.authService.getUsuarioActual()?.id === u.id;
  }

  getExpiryDate(expiry: string | null): Date | null {
    return expiry ? new Date(expiry) : null;
  }

  getPlanLabel(plan: string | null): string {
    if (!plan) return '—';
    return plan === 'MENSUAL' ? 'Mensual' : plan === 'ANUAL' ? 'Anual' : plan;
  }

  getMetodoPagoLabel(metodo: string | null): string {
    if (!metodo) return '—';
    const map: Record<string, string> = {
      tarjeta:    'Tarjeta',
      paypal:     'PayPal',
      apple_pay:  'Apple Pay',
      google_pay: 'Google Pay',
      sepa:       'SEPA',
      klarna:     'Klarna',
    };
    return map[metodo.toLowerCase()] ?? metodo;
  }

  getRolLabel(u: AdminUsuario): string {
    const rol = u.roles.find(r => this.ROLES.some(x => x.value === r));
    return this.ROLES.find(x => x.value === rol)?.label ?? 'Usuario';
  }

  private resetForm(): void {
    this.fNombre = this.fApellidos = this.fEmail = this.fPassword = this.fPlanTipo = this.fMetodoPago = '';
    this.fRol = 'ROLE_USER';
  }
}
