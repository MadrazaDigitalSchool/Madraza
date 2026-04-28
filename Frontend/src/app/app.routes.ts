import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

/**
 * Configuración de rutas principales de la aplicación
 * Usamos Lazy Loading para cargar cada módulo solo cuando se necesita
 * mejorando el rendimiento y el tiempo de carga inicial
 * @author Hafdala Mehdi Sidi
 */
export const routes: Routes = [
    // Ruta raíz — redirige al home
    {
        path: '',
        redirectTo: 'tests',
        pathMatch: 'full'
    },

    // Autenticación — carga solo cuando el usuario va a /auth
    {
        path: 'auth',
        loadChildren: () =>
            import('./features/auth/auth.routes')
                .then(m => m.AUTH_ROUTES)
    },

    // Tests — público, no requiere login
    {
        path: 'tests',
        loadChildren: () =>
            import('./features/tests/tests.routes')
                .then(m => m.TESTS_ROUTES)
    },

    // Examen — requiere estar autenticado
    {
        path: 'examen',
        canActivate: [authGuard],
        loadChildren: () =>
            import('./features/examen/examen.routes')
                .then(m => m.EXAMEN_ROUTES)
    },

    // Dashboard — requiere estar autenticado
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadChildren: () =>
            import('./features/dashboard/dashboard.routes')
                .then(m => m.DASHBOARD_ROUTES)
    },

    // Ruta no encontrada — redirige al home
    {
        path: '**',
        redirectTo: 'tests'
    }
];