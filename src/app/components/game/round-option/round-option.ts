import { Component, model, signal } from '@angular/core';

@Component({
  selector: 'app-round-option',
  imports: [],
  templateUrl: './round-option.html',
})
export class RoundOption {
  readonly options = [5, 10, 15, 20, 25];
  readonly value = model(5);
}
