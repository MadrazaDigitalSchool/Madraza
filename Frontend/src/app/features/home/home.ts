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
    { icon: 'quiz', title: 'Tests ilimitados', desc: 'Accede a cientos de tests en todas las categorías y niveles de dificultad.' },
    { icon: 'timer', title: 'Modo examen', desc: 'Simula condiciones reales con temporizador y seguimiento de progreso.' },
    { icon: 'bar_chart', title: 'Estadísticas avanzadas', desc: 'Analiza tu rendimiento, detecta tus puntos débiles y mejora tu nota.' },
    { icon: 'edit_note', title: 'Crea tus tests', desc: 'Diseña tus propios exámenes y compártelos con la comunidad.' },
    { icon: 'groups', title: 'Para todos', desc: 'Ideal para estudiantes, opositores, docentes y equipos.' },
    { icon: 'star', title: 'Premium asequible', desc: 'Desde 9,99€/mes. Cancela cuando quieras, sin permanencia.' }
  ];
  stats = [
    { valor: '+500', label: 'Tests disponibles' },
    { valor: '+10k', label: 'Preguntas en la BD' },
    { valor: '+2k', label: 'Usuarios activos' },
    { valor: '9,99€', label: 'Desde /mes' }
  ];
}
