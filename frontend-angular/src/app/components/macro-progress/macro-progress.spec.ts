import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MacroProgress } from './macro-progress';

describe('MacroProgress', () => {
  let component: MacroProgress;
  let fixture: ComponentFixture<MacroProgress>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MacroProgress]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MacroProgress);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
