import { Routes } from '@angular/router';

/**
 * Rutas del módulo de tests
 * @author Hafdala Mehdi Sidi
 */
export const TESTS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./lista-tests/lista-tests')
                .then(m => m.ListaTestsComponent)
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./detalle-test/detalle-test')
                .then(m => m.DetalleTestComponent)
    }
];