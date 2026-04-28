import { Routes } from '@angular/router';

/**
 * Rutas del módulo de tests
 * @author Hafdala Mehdi Sidi
 */
export const TESTS_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./lista-tests/lista-tests.component')
                .then(m => m.ListaTestsComponent)
    },
    {
        path: ':id',
        loadComponent: () =>
            import('./detalle-test/detalle-test.component')
                .then(m => m.DetalleTestComponent)
    }
];