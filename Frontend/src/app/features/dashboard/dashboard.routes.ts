import { Routes } from '@angular/router';

/**
 * Rutas del módulo de dashboard
 * @author Hafdala Mehdi Sidi
 */
export const DASHBOARD_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./dashboard/dashboard.component')
                .then(m => m.DashboardComponent)
    }
];