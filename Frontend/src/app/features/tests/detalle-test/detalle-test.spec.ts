import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleTest } from './detalle-test';

describe('DetalleTest', () => {
  let component: DetalleTest;
  let fixture: ComponentFixture<DetalleTest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleTest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleTest);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
