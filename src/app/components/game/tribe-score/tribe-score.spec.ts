import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TribeScore } from './tribe-score';

describe('TribeScore', () => {
  let component: TribeScore;
  let fixture: ComponentFixture<TribeScore>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TribeScore],
    }).compileComponents();

    fixture = TestBed.createComponent(TribeScore);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
