import { Component } from '@angular/core';
import { GameComponent } from './components/game/game';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [GameComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {}