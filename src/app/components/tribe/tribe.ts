import { Component, effect, input, signal } from '@angular/core';
import { Tribe } from '../../models/tribe.model';
import { NgClass } from '@angular/common';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-tribe',
  imports: [NgClass],
  templateUrl: './tribe.html',
  styleUrl: './tribe.css',
})
export class TribeComponent {
  tribe = input.required<Tribe>();
  readonly rankingMode = input(false);
  readonly revealed = input(false);
  readonly position = input<number | null>(null);
  readonly score = input<number | null>(null);

  constructor() {
    effect(() => {
      if (!this.revealed()) return;
      if (this.position() !== 1) return;

      setTimeout(() => {
        this.celebrate();
      }, 4200);
    });
  }

  toggleReveal(): void {
    if (!this.rankingMode()) return;
  }

  getRankStyle(): string {
    switch (this.position()) {
      case 1:
        return `
        border-[#e9b93f]
        bg-[#e9b93f]/10
        shadow-[0_0_20px_rgba(233,185,63,0.7),0_0_0_3px_rgba(233,185,63,0.25)]
      `;

      case 2:
        return `
        border-[#d9dde3]
        bg-[#d9dde3]/10
        shadow-[0_0_20px_rgba(217,221,227,0.6),0_0_0_3px_rgba(217,221,227,0.2)]
      `;

      case 3:
        return `
        border-[#cd7f32]
        bg-[#cd7f32]/10
        shadow-[0_0_20px_rgba(205,127,50,0.6),0_0_0_3px_rgba(205,127,50,0.2)]
      `;

      default:
        return 'border-border bg-background';
    }
  }

  private celebrate() {
    confetti({
      particleCount: 150,
      spread: 100,
      startVelocity: 45,
      origin: {
        x: 0.5,
        y: 0.6,
      },
      colors: ['#e9b93f', '#f3efe6', '#c69a33', '#ffffff'],
      zIndex: 999,
    });
  }
}
