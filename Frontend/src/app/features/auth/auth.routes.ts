import { Routes } from '@angular/router';

/**
 * Rutas del módulo de autenticación
 * @author Hafdala Mehdi Sidi
 */
export const AUTH_ROUTES: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./login/login').then(m => m.LoginComponent)
    },
    {
        path: 'registro',
        loadComponent: () => import('./registro/registro').then(m => m.RegistroComponent)
    },
    {
        path: 'recuperar-password',
        loadComponent: () =>
            import('./recuperar-password/recuperar-password').then(m => m.RecuperarPasswordComponent)
    },
    {
        path: 'nueva-password',
        loadComponent: () =>
            import('./nueva-password/nueva-password').then(m => m.NuevaPasswordComponent)
    },
    {
        path: 'verificar-email',
        loadComponent: () =>
            import('./verificar-email/verificar-email').then(m => m.VerificarEmailComponent)
    },
    {
        path: 'oauth2/callback',
        loadComponent: () =>
            import('./oauth2-callback/oauth2-callback').then(m => m.OAuth2CallbackComponent)
    },
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
    }
];
