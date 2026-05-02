import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth-guard';

export const TESTS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./lista-tests/lista-tests')
                .then(m => m.ListaTestsComponent)
    },
    {
        path: 'crear',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./crear-test/crear-test')
                .then(m => m.CrearTestComponent)
    },
    {
        path: 'editar/:id',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./editar-test/editar-test')
                .then(m => m.EditarTestComponent)
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./detalle-test/detalle-test')
                .then(m => m.DetalleTestComponent)
    }
];