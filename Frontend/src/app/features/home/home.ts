import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  features = [
    { icon: 'library_books', title: 'Recursos ilimitados', desc: 'Accede a cientos de recursos formativos en todas las categorías y niveles de dificultad.' },
    { icon: 'timer', title: 'Modo examen', desc: 'Simula condiciones reales con temporizador y seguimiento de progreso.' },
    { icon: 'bar_chart', title: 'Estadísticas avanzadas', desc: 'Analiza tu rendimiento, detecta tus puntos débiles y mejora tu nota.' },
    { icon: 'edit_note', title: 'Toma apuntes', desc: 'Crea y organiza tus apuntes vinculados a cada tema. Con asistencia de IA.' },
    { icon: 'groups', title: 'Para centros y empresas', desc: 'Crea organizaciones, asigna recursos a grupos y haz seguimiento del progreso.' },
    { icon: 'star', title: 'Premium asequible', desc: 'Desde 9,99€/mes. Empieza gratis. Cancela cuando quieras.' }
  ];
  stats = [
    { valor: '+500', label: 'Recursos disponibles' },
    { valor: '+10k', label: 'Preguntas en la BD' },
    { valor: '+2k', label: 'Usuarios activos' },
    { valor: '0€', label: 'Para empezar' }
  ];
}
