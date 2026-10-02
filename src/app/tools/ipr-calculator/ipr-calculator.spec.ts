import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IprCalculator } from './ipr-calculator';

describe('IprCalculator', () => {
  let component: IprCalculator;
  let fixture: ComponentFixture<IprCalculator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IprCalculator],
    }).compileComponents();

    fixture = TestBed.createComponent(IprCalculator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
