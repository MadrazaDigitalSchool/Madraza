import { Routes } from '@angular/router';

/**
 * Rutas del módulo de examen
 * @author Hafdala Mehdi Sidi
 */
export const EXAMEN_ROUTES: Routes = [
    {
        path: ':id',
        loadComponent: () =>
            import('./examen/examen')
                .then(m => m.ExamenComponent)
    },
    {
        path: ':id/resultados',
        loadComponent: () =>
            import('./resultados/resultados')
                .then(m => m.ResultadosComponent)
    }
];