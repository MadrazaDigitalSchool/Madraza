import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { ContactoService } from '../../../core/services/contacto.service';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule],
  templateUrl: './contacto.html',
  styleUrl: './contacto.scss'
})
export class ContactoComponent {
  nombre = '';
  email = '';
  asunto = '';
  mensaje = '';
  enviado = false;
  enviando = false;

  constructor(private contactoService: ContactoService) {}

  enviar(): void {
    if (!this.nombre || !this.email || !this.asunto || !this.mensaje) return;
    this.enviando = true;
    this.contactoService.enviar({
      nombre: this.nombre,
      email: this.email,
      asunto: this.asunto,
      mensaje: this.mensaje
    }).subscribe({
      next: () => {
        this.enviado = true;
        this.enviando = false;
      },
      error: () => {
        this.enviando = false;
      }
    });
  }
}
