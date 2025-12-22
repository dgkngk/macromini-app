import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimitReachedModal } from './limit-reached-modal';

describe('LimitReachedModal', () => {
  let component: LimitReachedModal;
  let fixture: ComponentFixture<LimitReachedModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LimitReachedModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LimitReachedModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
