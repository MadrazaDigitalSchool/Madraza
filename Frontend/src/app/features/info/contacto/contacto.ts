import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

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

  enviar(): void {
    if (!this.nombre || !this.email || !this.asunto || !this.mensaje) return;
    this.enviando = true;
    setTimeout(() => {
      this.enviado = true;
      this.enviando = false;
    }, 1200);
  }
}
