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
import { OrganizacionService, Organizacion, Miembro, AsignacionOrg } from '../../core/services/organizacion.service';
import { TestService } from '../../core/services/test';
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

  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private orgService = inject(OrganizacionService);
  private testService = inject(TestService);
  private authService = inject(AuthService);
  private snackBar   = inject(MatSnackBar);
  private dialog     = inject(MatDialog);

  org         = signal<Organizacion | null>(null);
  cargando    = signal(true);
  usuarioId   = this.authService.getUsuarioActual()?.id ?? 0;

  // Invitar
  emailInvitar = '';
  invitando    = signal(false);

  // Asignar test
  mostrarAsignar  = false;
  misTests: Test[] = [];
  testSeleccionado: number | null = null;
  fechaLimite  = '';
  instrucciones = '';
  asignando    = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar(id);
    this.testService.getMisTests().subscribe({ next: t => this.misTests = t });
  }

  cargar(id: number): void {
    this.cargando.set(true);
    this.orgService.getById(id).subscribe({
      next: org => { this.org.set(org); this.cargando.set(false); },
      error: () => { this.cargando.set(false); this.router.navigate(['/organizaciones']); }
    });
  }

  get esAdmin(): boolean { return this.org()?.adminId === this.usuarioId; }

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
    if (!this.testSeleccionado || !this.org()) return;
    this.asignando.set(true);
    this.orgService.asignarTest(
      this.org()!.id, this.testSeleccionado,
      this.fechaLimite || null, this.instrucciones
    ).subscribe({
      next: asig => {
        this.org.update(o => ({ ...o!, asignaciones: [...(o!.asignaciones ?? []), asig] }));
        this.mostrarAsignar = false;
        this.testSeleccionado = null;
        this.fechaLimite = this.instrucciones = '';
        this.asignando.set(false);
        this.snackBar.open('Recurso asignado a todos los miembros.', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.asignando.set(false);
        this.snackBar.open(err.error?.error || 'Error al asignar', 'Cerrar', { duration: 4000 });
      }
    });
  }

  copiarCodigo(): void {
    const codigo = this.org()?.codigoInvitacion ?? '';
    navigator.clipboard.writeText(codigo).then(() =>
      this.snackBar.open('Código copiado.', 'Cerrar', { duration: 2000 })
    );
  }
}
