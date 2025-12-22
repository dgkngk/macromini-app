import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecipeModal } from './recipe-modal';

describe('RecipeModal', () => {
  let component: RecipeModal;
  let fixture: ComponentFixture<RecipeModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecipeModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
