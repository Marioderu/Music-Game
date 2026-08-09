import { Component, input, signal } from '@angular/core';
import { Tribe } from '../../models/tribe.model';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-tribe',
  imports: [NgClass],
  templateUrl: './tribe.html',
  styleUrl: './tribe.css',
})
export class TribeComponent {
  tribe = input.required<Tribe>();
  score = signal(0);

  addScore(newScore: number) {
    this.score.update((score) => score + newScore);
  }
}
