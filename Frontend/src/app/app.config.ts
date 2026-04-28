import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt-interceptor';

/**
 * Configuración principal de la aplicación Angular
 * Registramos los providers globales:
 * - Router con Lazy Loading
 * - HttpClient con interceptor JWT
 * - Animaciones de Angular Material
 * @author Hafdala Mehdi Sidi
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([jwtInterceptor])
    ),
    provideAnimations()
  ]
};