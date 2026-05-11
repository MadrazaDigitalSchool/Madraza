import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CompartirService } from '../../../core/services/compartir.service';

@Component({
  selector: 'app-compartir-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <h2 mat-dialog-title>Compartir "{{ data.testTitulo }}"</h2>
    <div mat-dialog-content>
      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Email del destinatario</mat-label>
        <input matInput type="email" [(ngModel)]="email" placeholder="usuario@ejemplo.com" />
      </mat-form-field>
      <mat-form-field appearance="outline" style="width:100%;margin-top:8px">
        <mat-label>Mensaje (opcional)</mat-label>
        <textarea matInput [(ngModel)]="mensaje" rows="3" placeholder="Añade un mensaje..."></textarea>
      </mat-form-field>
      @if (error()) {
        <p style="color:#e53935;font-size:13px;margin-top:4px">{{ error() }}</p>
      }
      @if (exito()) {
        <p style="color:#43a047;font-size:13px;margin-top:4px">¡Recurso compartido correctamente!</p>
      }
    </div>
    <div mat-dialog-actions align="end" style="gap:8px">
      <button mat-button (click)="cerrar()">Cancelar</button>
      <button mat-flat-button color="primary" (click)="compartir()" [disabled]="enviando()">
        @if (enviando()) { <mat-spinner diameter="18"></mat-spinner> } @else { Compartir }
      </button>
    </div>
  `
})
export class CompartirDialogComponent {
  email   = '';
  mensaje = '';
  enviando = signal(false);
  error    = signal('');
  exito    = signal(false);

  constructor(
    private ref: MatDialogRef<CompartirDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { testId: number; testTitulo: string },
    private compartirService: CompartirService
  ) {}

  compartir(): void {
    if (!this.email.trim()) { this.error.set('El email es obligatorio'); return; }
    this.enviando.set(true);
    this.error.set('');
    this.compartirService.compartir(this.data.testId, this.email.trim(), this.mensaje).subscribe({
      next: () => {
        this.enviando.set(false);
        this.exito.set(true);
        setTimeout(() => this.ref.close(true), 1500);
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(err.error?.error || err.error?.message || 'Error al compartir. Inténtalo de nuevo.');
      }
    });
  }

  cerrar(): void { this.ref.close(false); }
}
