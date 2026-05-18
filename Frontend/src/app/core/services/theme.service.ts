import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly KEY = 'madraza-tema';

  temaClaro = signal(false);

  constructor() {
    const inicial = localStorage.getItem(this.KEY) === 'claro';
    this.temaClaro.set(inicial);
    this.aplicar(inicial);
  }

  toggle(): void {
    const nuevo = !this.temaClaro();
    this.temaClaro.set(nuevo);
    localStorage.setItem(this.KEY, nuevo ? 'claro' : 'oscuro');
    this.aplicar(nuevo);
  }

  private aplicar(claro: boolean): void {
    document.body.classList.toggle('tema-claro', claro);
    document.documentElement.style.colorScheme = claro ? 'light' : 'dark';
  }
}
