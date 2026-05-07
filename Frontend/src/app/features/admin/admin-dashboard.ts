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
import { RouterLink } from '@angular/router';
import {
  AdminService, AdminStats, AdminUsuario, AdminTest
} from '../../core/services/admin.service';

type Tab = 'resumen' | 'usuarios' | 'tests';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule, DatePipe, FormsModule, RouterLink,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatChipsModule, MatFormFieldModule, MatInputModule,
    MatTooltipModule, MatDividerModule
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboardComponent implements OnInit {

  private adminService = inject(AdminService);

  tabActiva = signal<Tab>('resumen');

  stats = signal<AdminStats | null>(null);
  usuarios = signal<AdminUsuario[]>([]);
  tests = signal<AdminTest[]>([]);

  cargandoStats = signal(false);
  cargandoUsuarios = signal(false);
  cargandoTests = signal(false);

  busquedaUsuario = signal('');
  busquedaTest = signal('');

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

  ngOnInit(): void {
    this.cargarStats();
  }

  setTab(tab: Tab): void {
    this.tabActiva.set(tab);
    if (tab === 'usuarios' && this.usuarios().length === 0) this.cargarUsuarios();
    if (tab === 'tests' && this.tests().length === 0) this.cargarTests();
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

  activarSuscripcion(usuario: AdminUsuario, dias: 30 | 365): void {
    this.adminService.updateSuscripcion(usuario.id, true, dias).subscribe({
      next: res => {
        this.usuarios.update(list =>
          list.map(u => u.id === usuario.id
            ? { ...u, suscripcionActiva: res.suscripcionActiva, suscripcionExpiry: res.suscripcionExpiry }
            : u)
        );
      }
    });
  }

  desactivarSuscripcion(usuario: AdminUsuario): void {
    this.adminService.updateSuscripcion(usuario.id, false).subscribe({
      next: res => {
        this.usuarios.update(list =>
          list.map(u => u.id === usuario.id
            ? { ...u, suscripcionActiva: false, suscripcionExpiry: null }
            : u)
        );
      }
    });
  }

  toggleUsuarioActivo(usuario: AdminUsuario): void {
    const nuevoEstado = !usuario.activo;
    this.adminService.updateActivo(usuario.id, nuevoEstado).subscribe({
      next: () => {
        this.usuarios.update(list =>
          list.map(u => u.id === usuario.id ? { ...u, activo: nuevoEstado } : u)
        );
      }
    });
  }

  toggleTestActivo(test: AdminTest): void {
    const nuevoEstado = !test.activo;
    this.adminService.updateTestActivo(test.id, nuevoEstado).subscribe({
      next: () => {
        this.tests.update(list =>
          list.map(t => t.id === test.id ? { ...t, activo: nuevoEstado } : t)
        );
      }
    });
  }

  eliminarTest(test: AdminTest): void {
    if (!confirm(`¿Eliminar el test "${test.titulo}"? Esta acción no se puede deshacer.`)) return;
    this.adminService.deleteTest(test.id).subscribe({
      next: () => this.tests.update(list => list.filter(t => t.id !== test.id))
    });
  }

  esAdmin(usuario: AdminUsuario): boolean {
    return usuario.roles.includes('ROLE_ADMIN');
  }

  getExpiryDate(expiry: string | null): Date | null {
    return expiry ? new Date(expiry) : null;
  }
}
