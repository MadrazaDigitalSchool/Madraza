import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, switchMap, of } from 'rxjs';
import { TestService } from './test';
import { ApunteService, Apunte } from './apunte.service';
import { Test } from '../models/test.model';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog';

@Injectable({ providedIn: 'root' })
export class RecursoGuardService {

  private dialog      = inject(MatDialog);
  private testService = inject(TestService);
  private apunteService = inject(ApunteService);

  /** Abre el diálogo de confirmación de eliminación de TEST con avisos de dependencias. */
  confirmarEliminarTest(test: Test): Observable<boolean> {
    return this.testService.getDependencias(test.id).pipe(
      switchMap(deps => {
        const detalles: string[] = [];
        if (deps.asignaciones > 0)
          detalles.push(`Asignado en ${deps.asignaciones} organización${deps.asignaciones > 1 ? 'es' : ''}`);
        if (deps.apuntesAsociados > 0)
          detalles.push(`${deps.apuntesAsociados} apunte${deps.apuntesAsociados > 1 ? 's' : ''} vinculado${deps.apuntesAsociados > 1 ? 's' : ''} a este examen`);

        const ref = this.dialog.open(ConfirmDialogComponent, {
          width: '420px',
          data: {
            titulo: 'Eliminar test',
            advertencia: detalles.length
              ? 'Este recurso tiene dependencias activas. Eliminar puede afectar a otros usuarios.'
              : undefined,
            detalles: detalles.length ? detalles : undefined,
            mensaje: `¿Seguro que quieres eliminar "${test.titulo}"? Esta acción no se puede deshacer.`,
            labelConfirmar: 'Eliminar',
            labelCancelar: 'Cancelar'
          }
        });
        return ref.afterClosed() as Observable<boolean>;
      })
    );
  }

  /** Abre el diálogo de confirmación de edición de TEST si tiene dependencias. */
  confirmarEditarTest(test: Test): Observable<boolean> {
    return this.testService.getDependencias(test.id).pipe(
      switchMap(deps => {
        const hayDeps = deps.asignaciones > 0 || deps.apuntesAsociados > 0;
        if (!hayDeps) return of(true); // sin dependencias → proceder directamente

        const detalles: string[] = [];
        if (deps.asignaciones > 0)
          detalles.push(`Asignado en ${deps.asignaciones} organización${deps.asignaciones > 1 ? 'es' : ''}`);
        if (deps.apuntesAsociados > 0)
          detalles.push(`${deps.apuntesAsociados} apunte${deps.apuntesAsociados > 1 ? 's' : ''} vinculado${deps.apuntesAsociados > 1 ? 's' : ''} a este examen`);

        const ref = this.dialog.open(ConfirmDialogComponent, {
          width: '420px',
          data: {
            titulo: 'Editar test con dependencias',
            advertencia: 'Este recurso tiene dependencias activas. Los cambios afectarán a todos los usuarios asociados.',
            detalles,
            mensaje: `¿Quieres continuar editando "${test.titulo}"?`,
            labelConfirmar: 'Sí, editar',
            labelCancelar: 'Cancelar'
          }
        });
        return ref.afterClosed() as Observable<boolean>;
      })
    );
  }

  /** Abre el diálogo de confirmación de eliminación de APUNTE con avisos de dependencias. */
  confirmarEliminarApunte(apunte: Apunte): Observable<boolean> {
    return this.apunteService.getDependencias(apunte.id).pipe(
      switchMap(deps => {
        const detalles: string[] = [];
        if (deps.asignaciones > 0)
          detalles.push(`Asignado en ${deps.asignaciones} organización${deps.asignaciones > 1 ? 'es' : ''}`);

        const ref = this.dialog.open(ConfirmDialogComponent, {
          width: '420px',
          data: {
            titulo: 'Eliminar apunte',
            advertencia: detalles.length
              ? 'Este apunte está asignado a usuarios. Eliminar afectará a sus asignaciones.'
              : undefined,
            detalles: detalles.length ? detalles : undefined,
            mensaje: `¿Seguro que quieres eliminar "${apunte.titulo}"?`,
            labelConfirmar: 'Eliminar',
            labelCancelar: 'Cancelar'
          }
        });
        return ref.afterClosed() as Observable<boolean>;
      })
    );
  }
}
