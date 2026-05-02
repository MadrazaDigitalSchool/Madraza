import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookies.html',
  styleUrl: './cookies.scss'
})
export class CookiesComponent { ultimaActualizacion = '2 de enero de 2026'; }
