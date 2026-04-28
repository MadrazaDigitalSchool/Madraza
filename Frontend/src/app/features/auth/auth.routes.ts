import { Routes } from '@angular/router';

/**
 * Rutas del módulo de autenticación
 * @author Hafdala Mehdi Sidi
 */
export const AUTH_ROUTES: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./login/login.component')
                .then(m => m.LoginComponent)
    },
    {
        path: 'registro',
        loadComponent: () =>
            import('./registro/registro.component')
                .then(m => m.RegistroComponent)
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];