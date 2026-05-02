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
    { icon: 'quiz', title: 'Tests ilimitados', desc: 'Accede a cientos de tests en todas las categorías y niveles.' },
    { icon: 'timer', title: 'Modo examen', desc: 'Simula condiciones reales con temporizador y seguimiento de progreso.' },
    { icon: 'bar_chart', title: 'Estadísticas', desc: 'Analiza tu rendimiento y detecta tus puntos débiles.' },
    { icon: 'edit_note', title: 'Crea tests', desc: 'Diseña tus propios exámenes y compártelos con la comunidad.' },
    { icon: 'groups', title: 'Para todos', desc: 'Ideal para estudiantes, opositores, docentes y empresas.' },
    { icon: 'verified', title: 'Gratuito', desc: 'Acceso completo sin coste. Regístrate y empieza ahora.' }
  ];
  stats = [
    { valor: '+500', label: 'Tests disponibles' },
    { valor: '+10k', label: 'Preguntas en la BD' },
    { valor: '+2k', label: 'Usuarios activos' },
    { valor: '100%', label: 'Gratuito' }
  ];
}
