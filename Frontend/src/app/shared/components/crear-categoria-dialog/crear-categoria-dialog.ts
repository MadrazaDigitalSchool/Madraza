import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-crear-categoria-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, FormsModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Nueva categoría</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nombre de la categoría</mat-label>
        <mat-icon matPrefix>category</mat-icon>
        <input matInput [(ngModel)]="nombre" placeholder="Ej: Programación" maxlength="60" />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button mat-dialog-close>Cancelar</button>
      <button mat-flat-button [disabled]="!nombre.trim()" [mat-dialog-close]="nombre.trim()">
        <mat-icon>add</mat-icon> Crear
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    mat-dialog-content { min-width: 350px; padding-top: 12px; }
  `]
})
export class CrearCategoriaDialogComponent {
  nombre = '';
  constructor(public dialogRef: MatDialogRef<CrearCategoriaDialogComponent>) {}
}
