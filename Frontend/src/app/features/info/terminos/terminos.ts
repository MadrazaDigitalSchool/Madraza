import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-terminos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terminos.html',
  styleUrl: './terminos.scss'
})
export class TerminosComponent { ultimaActualizacion = '2 de enero de 2026'; }
