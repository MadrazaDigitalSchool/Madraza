import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { OrganizacionService, Organizacion, Miembro, AsignacionOrg, ResultadoAsignacion, EstadisticasMiembro } from '../../core/services/organizacion.service';
import { TestService } from '../../core/services/test';
import { ApunteService, Apunte } from '../../core/services/apunte.service';
import { AuthService } from '../../core/services/auth';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';
import { Test } from '../../core/models/test.model';

@Component({
  selector: 'app-organizacion-detalle',
  standalone: true,
  imports: [
    CommonModule, DatePipe, RouterLink, FormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatTabsModule, MatFormFieldModule, MatInputModule, MatSelectModule
  ],
  templateUrl: './organizacion-detalle.html',
  styleUrl: './organizacion-detalle.scss'
})
export class OrganizacionDetalleComponent implements OnInit {

  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private orgService   = inject(OrganizacionService);
  private testService  = inject(TestService);
  private apunteService = inject(ApunteService);
  private authService  = inject(AuthService);
  private snackBar   = inject(MatSnackBar);
  private dialog     = inject(MatDialog);

  org         = signal<Organizacion | null>(null);
  cargando    = signal(true);
  usuarioId   = this.authService.getUsuarioActual()?.id ?? 0;

  // Editar organización
  editando        = false;
  guardandoEdicion = signal(false);
  fNombre      = '';
  fTipo        = 'CENTRO_EDUCATIVO';
  fDescripcion = '';

  // Eliminar organización
  eliminando = signal(false);

  // Invitar
  emailInvitar = '';
  invitando    = signal(false);

  // Asignar recurso
  mostrarAsignar      = false;
  tipoRecurso: 'TEST' | 'APUNTE' = 'TEST';
  misTests: Test[]    = [];
  misApuntes: Apunte[] = [];
  testSeleccionado:   number | null = null;
  apunteSeleccionado: number | null = null;
  miembroSeleccionado: number | null = null;
  fechaLimite   = '';
  instrucciones = '';
  asignando     = signal(false);

  // Exámenes propios de la organización
  examenesOrg: Test[] = [];

  // Resultados de asignación expandida
  resultadosAsignacion = new Map<number, ResultadoAsignacion[]>();
  cargandoResultados   = new Set<number>();

  // Estadísticas de miembro expandido
  statsMiembro = new Map<number, EstadisticasMiembro>();
  cargandoStats = new Set<number>();

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar(id);
    this.testService.getMisTests().subscribe({ next: t => this.misTests = t });
    this.apunteService.getMisApuntes().subscribe({ next: a => this.misApuntes = a });
    this.testService.getTestsOrganizacion(id).subscribe({ next: t => this.examenesOrg = t, error: () => {} });
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.orgService.getById(id).subscribe({
      next: org => { this.org.set(org); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.router.navigate(['/organizaciones']); }
    });
  }

  get esAdmin(): boolean { return this.org()?.adminId === this.usuarioId; }

  get fechaMinima(): string {
    // Mínimo = ahora mismo (no se permite fecha+hora anterior al momento actual)
    const ahora = new Date();
    return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }

  abrirEdicion(): void {
    const o = this.org();
    if (!o) return;
    this.fNombre      = o.nombre;
    this.fTipo        = o.tipo;
    this.fDescripcion = o.descripcion ?? '';
    this.editando     = true;
  }

  cancelarEdicion(): void {
    this.editando = false;
  }

  guardarEdicion(): void {
    if (!this.fNombre.trim() || !this.org()) return;
    this.guardandoEdicion.set(true);
    this.orgService.actualizar(this.org()!.id, {
      nombre:      this.fNombre.trim(),
      tipo:        this.fTipo,
      descripcion: this.fDescripcion.trim()
    }).subscribe({
      next: updated => {
        this.org.update(o => ({ ...o!, nombre: updated.nombre, tipo: updated.tipo, descripcion: updated.descripcion }));
        this.guardandoEdicion.set(false);
        this.editando = false;
        this.snackBar.open('Organización actualizada.', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.guardandoEdicion.set(false);
        this.snackBar.open(err.error?.error || 'Error al actualizar', 'Cerrar', { duration: 4000 });
      }
    });
  }

  eliminarOrganizacion(): void {
    const o = this.org();
    if (!o) return;
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Eliminar organización',
        mensaje: `¿Eliminar "${o.nombre}"? Se perderán todos los miembros y asignaciones. Esta acción no se puede deshacer.`,
        labelConfirmar: 'Eliminar',
        labelCancelar:  'Cancelar'
      }
    });
    ref.afterClosed().subscribe(confirmado => {
      if (!confirmado) return;
      this.eliminando.set(true);
      this.orgService.eliminar(o.id).subscribe({
        next: () => this.router.navigate(['/organizaciones']),
        error: (err) => {
          this.eliminando.set(false);
          this.snackBar.open(err.error?.error || 'Error al eliminar', 'Cerrar', { duration: 4000 });
        }
      });
    });
  }

  invitar(): void {
    if (!this.emailInvitar.trim() || !this.org()) return;
    this.invitando.set(true);
    this.orgService.invitar(this.org()!.id, this.emailInvitar.trim()).subscribe({
      next: miembro => {
        this.org.update(o => ({ ...o!, miembros: [...(o!.miembros ?? []), miembro] }));
        this.emailInvitar = '';
        this.invitando.set(false);
        this.snackBar.open(`${miembro.nombre} añadido/a.`, 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.invitando.set(false);
        this.snackBar.open(err.error?.error || 'Error al invitar', 'Cerrar', { duration: 4000 });
      }
    });
  }

  expulsar(miembro: Miembro): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: { titulo: 'Expulsar miembro', mensaje: `¿Expulsar a ${miembro.nombre}?`, labelConfirmar: 'Expulsar', labelCancelar: 'Cancelar' }
    });
    ref.afterClosed().subscribe(ok => {
      if (!ok) return;
      this.orgService.expulsar(this.org()!.id, miembro.usuarioId).subscribe({
        next: () => {
          this.org.update(o => ({ ...o!, miembros: (o!.miembros ?? []).filter(m => m.id !== miembro.id) }));
          this.snackBar.open('Miembro expulsado.', 'Cerrar', { duration: 3000 });
        }
      });
    });
  }

  asignar(): void {
    const recursoOk = this.tipoRecurso === 'TEST' ? !!this.testSeleccionado : !!this.apunteSeleccionado;
    if (!recursoOk || !this.org()) return;
    if (this.fechaLimite && new Date(this.fechaLimite) <= new Date()) {
      this.snackBar.open('La fecha límite debe ser posterior al momento actual.', 'Cerrar', { duration: 4000 });
      return;
    }
    this.asignando.set(true);
    this.orgService.asignarRecurso(
      this.org()!.id,
      this.tipoRecurso,
      this.tipoRecurso === 'TEST'   ? this.testSeleccionado   : null,
      this.tipoRecurso === 'APUNTE' ? this.apunteSeleccionado : null,
      this.fechaLimite || null,
      this.instrucciones,
      this.miembroSeleccionado
    ).subscribe({
      next: asig => {
        this.org.update(o => ({ ...o!, asignaciones: [...(o!.asignaciones ?? []), asig] }));
        this.mostrarAsignar    = false;
        this.testSeleccionado  = null;
        this.apunteSeleccionado = null;
        this.miembroSeleccionado = null;
        this.tipoRecurso = 'TEST';
        this.fechaLimite = this.instrucciones = '';
        this.asignando.set(false);
        const dest = asig.destinatarioNombre ?? 'todos los miembros';
        this.snackBar.open(`Recurso asignado a ${dest}.`, 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.asignando.set(false);
        this.snackBar.open(err.error?.error || 'Error al asignar', 'Cerrar', { duration: 4000 });
      }
    });
  }

  toggleResultados(asig: AsignacionOrg): void {
    if (!this.esAdmin || asig.tipoRecurso !== 'TEST') return;
    if (this.resultadosAsignacion.has(asig.id)) {
      this.resultadosAsignacion.delete(asig.id);
      return;
    }
    this.cargandoResultados.add(asig.id);
    this.orgService.getResultadosAsignacion(this.org()!.id, asig.id).subscribe({
      next: r => { this.resultadosAsignacion.set(asig.id, r); this.cargandoResultados.delete(asig.id); },
      error: () => this.cargandoResultados.delete(asig.id)
    });
  }

  toggleStatsMiembro(miembro: Miembro): void {
    if (!this.esAdmin) return;
    if (this.statsMiembro.has(miembro.usuarioId)) {
      this.statsMiembro.delete(miembro.usuarioId);
      return;
    }
    this.cargandoStats.add(miembro.usuarioId);
    this.orgService.getEstadisticasMiembro(this.org()!.id, miembro.usuarioId).subscribe({
      next: s => { this.statsMiembro.set(miembro.usuarioId, s); this.cargandoStats.delete(miembro.usuarioId); },
      error: () => this.cargandoStats.delete(miembro.usuarioId)
    });
  }

  copiarCodigo(): void {
    const codigo = this.org()?.codigoInvitacion ?? '';
    navigator.clipboard.writeText(codigo).then(() =>
      this.snackBar.open('Código copiado.', 'Cerrar', { duration: 2000 })
    );
  }
}
