import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  temaClaro = signal(false);

  constructor() {
    // El tema siempre arranca en oscuro. Solo apuntes y examen pueden activar el claro,
    // y al salir de esas rutas se restaura automáticamente (ver ngOnDestroy en cada componente).
    this.aplicar(false);
  }

  toggle(): void {
    const nuevo = !this.temaClaro();
    this.temaClaro.set(nuevo);
    this.aplicar(nuevo);
  }

  reset(): void {
    this.temaClaro.set(false);
    this.aplicar(false);
  }

  private aplicar(claro: boolean): void {
    document.body.classList.toggle('tema-claro', claro);
    document.documentElement.style.colorScheme = claro ? 'light' : 'dark';
  }
}
