import { Component, input } from '@angular/core';

@Component({
  selector: 'app-carousel-card',
  imports: [],
  templateUrl: './carousel-card.html',
  styleUrl: './carousel-card.css',
})
export class CarouselCard {
  img = input.required<string>();
  artist = input.required<string>();
}
