import { Component, OnInit, OnDestroy, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService, GamePhase, Round } from '../../services/game.service';
import { SONGS, TRIBES } from '../../data/data';
import { SearchItem } from '../search-item/search-item';
import { Song } from '../../models/song.model';
import { Tribe } from '../../models/tribe.model';
import { TribeComponent } from '../tribe/tribe';
import { RoundOption } from './round-option/round-option';
import { UsedSong } from './used-song/used-song';
import { TribeScore } from './tribe-score/tribe-score';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, SearchItem, TribeComponent, RoundOption, UsedSong, TribeScore],
  templateUrl: './game.html',
  styleUrl: './game.css',
})
export class GameComponent implements OnInit, OnDestroy {
  readonly tribes: Tribe[] = [...TRIBES];
  readonly state;
  readonly answer;
  readonly usedSongs;
  readonly GamePhase: Record<GamePhase, GamePhase> = {
    notInitialized: 'notInitialized',
    loading: 'loading',
    listening: 'listening',
    waitingAnswer: 'waitingAnswer',
    revealed: 'revealed',
  };
  readonly selectedRounds = signal(5);
  readonly progress = signal(0);
  readonly search = signal('');
  readonly suggestions = computed(() => {
    const query = this.search().trim().toLowerCase();

    if (!query) return [];

    return SONGS.filter(
      (song) =>
        song.title.toLowerCase().includes(query) || song.artist.toLowerCase().includes(query),
    ).slice(0, 5);
  });
  private progressInterval?: number;

  constructor(private gameService: GameService) {
    this.state = this.gameService.readState;
    this.answer = this.gameService.answer;
    this.usedSongs = gameService.readUsedSongs;

    effect(() => {
      const state = this.state();

      if (state.phase === 'listening') {
        this.startProgress(state.playSeconds);
      } else {
        this.stopProgress();
      }
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.stopProgress();
    this.gameService['audioService']?.cleanup();
  }

  onStartGame(): void {
    this.gameService.startGame();
  }

  onListen(): void {
    this.gameService.replay(false);
  }

  onNewSong(): void {
    this.gameService.nextSong();
  }

  onRevealAnswer(): void {
    this.gameService.revealAnswer();
  }

  startProgress(seconds: number) {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
    }

    this.progress.set(0);

    const start = performance.now();
    const duration = seconds * 1000;

    const interval = window.setInterval(() => {
      const elapsed = performance.now() - start;

      this.progress.set(Math.min((elapsed / duration) * 100, 100));

      if (elapsed >= duration) {
        clearInterval(interval);

        if (this.progressInterval === interval) {
          this.progressInterval = undefined;
        }

        this.progress.set(100);
      }
    }, 16);

    this.progressInterval = interval;
  }

  private stopProgress(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = undefined;
    }

    this.progress.set(0);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.search.set(value);
  }

  onSelectSuggestion(song: Song): void {
    this.gameService.guessSong(song);
    this.search.set('');
  }

  onEmptySearch() {
    this.search.set('');
  }
}
