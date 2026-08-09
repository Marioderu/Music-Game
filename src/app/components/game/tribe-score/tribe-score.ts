import { Component, input, signal } from '@angular/core';
import { Tribe } from '../../../models/tribe.model';

@Component({
  selector: 'app-tribe-score',
  imports: [],
  templateUrl: './tribe-score.html',
  styleUrl: './tribe-score.css',
})
export class TribeScore {
  readonly tribe = input.required<Tribe>();
  readonly score = signal(0);

  addScore(points: number) {
    this.score.update((score) => score + points);
  }
}
