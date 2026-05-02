import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { EditarTestComponent } from './editar-test';
import { TestService } from '../../../core/services/test';

describe('EditarTestComponent', () => {
  let component: EditarTestComponent;
  let fixture: any;
  let testServiceSpy: jasmine.SpyObj<TestService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockTest = {
    id: 1,
    titulo: 'Test de ejemplo',
    descripcion: 'Descripción del test',
    categoria: 'Programación',
    dificultad: 'MEDIA' as const,
    tiempoLimite: 3600,
    visibilidad: 'PUBLICO' as const,
    activo: true,
    creador: { id: 1, nombre: 'Test User', email: 'test@example.com' },
    preguntas: [
      {
        id: 1,
        enunciado: '¿Qué es TypeScript?',
        tipo: 'OPCION_MULTIPLE' as const,
        orden: 1,
        puntos: 1,
        explicacion: 'TypeScript es un superconjunto de JavaScript',
        opciones: [
          { id: 1, texto: 'Un lenguaje de programación', esCorrecta: true, orden: 1 },
          { id: 2, texto: 'Una base de datos', esCorrecta: false, orden: 2 }
        ]
      }
    ]
  };

  beforeEach(async () => {
    testServiceSpy = jasmine.createSpyObj('TestService', ['getTestsPublicos', 'getTestById', 'actualizarTest']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    testServiceSpy.getTestsPublicos.and.returnValue(of([]));
    testServiceSpy.getTestById.and.returnValue(of(mockTest));

    await TestBed.configureTestingModule({
      imports: [EditarTestComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: TestService, useValue: testServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '1' } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditarTestComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.dificultad).toBe('MEDIA');
    expect(component.visibilidad).toBe('PUBLICO');
    expect(component.preguntas).toEqual([]);
  });

  it('should add a new question', () => {
    component.preguntas = [];
    component.agregarPregunta();
    expect(component.preguntas.length).toBe(1);
    expect(component.preguntas[0].opciones.length).toBe(4);
  });

  it('should remove a question and reorder', () => {
    component.preguntas = [
      { enunciado: 'P1', tipo: 'OPCION_MULTIPLE' as const, orden: 1, puntos: 1, explicacion: '', opciones: [] },
      { enunciado: 'P2', tipo: 'OPCION_MULTIPLE' as const, orden: 2, puntos: 1, explicacion: '', opciones: [] }
    ];
    component.eliminarPregunta(0);
    expect(component.preguntas.length).toBe(1);
    expect(component.preguntas[0].orden).toBe(1);
  });

  it('should validate form correctly', () => {
    component.titulo = '';
    component.categoria = '';
    component.preguntas = [];
    expect(component.esValido).toBeFalse();

    component.titulo = 'Valid Title';
    component.categoria = 'Valid Category';
    component.preguntas = [{
      enunciado: 'Valid question',
      tipo: 'OPCION_MULTIPLE' as const,
      orden: 1,
      puntos: 1,
      explicacion: '',
      opciones: [
        { texto: 'Option A', esCorrecta: true, orden: 1 },
        { texto: 'Option B', esCorrecta: false, orden: 2 }
      ]
    }];
    expect(component.esValido).toBeTrue();
  });
});
