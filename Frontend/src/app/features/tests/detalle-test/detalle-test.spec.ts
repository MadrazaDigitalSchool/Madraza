import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleTestComponent } from './detalle-test';

describe('DetalleTestComponent', () => {
  let component: DetalleTestComponent;
  let fixture: ComponentFixture<DetalleTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
