import { Routes } from '@angular/router';

/**
 * Rutas del módulo de autenticación
 * @author Hafdala Mehdi Sidi
 */
export const AUTH_ROUTES: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./login/login')
                .then(m => m.LoginComponent)
    },
    {
        path: 'registro',
        loadComponent: () =>
            import('./registro/registro')
                .then(m => m.RegistroComponent)
    },
    {
        path: 'recuperar-password',
        loadComponent: () =>
            import('./recuperar-password/recuperar-password')
                .then(m => m.RecuperarPasswordComponent)
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];