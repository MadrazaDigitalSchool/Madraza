import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaTests } from './lista-tests';

describe('ListaTests', () => {
  let component: ListaTests;
  let fixture: ComponentFixture<ListaTests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaTests]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaTests);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
